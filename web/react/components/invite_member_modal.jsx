// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import * as utils from '../utils/utils.jsx';
import Constants from '../utils/constants.jsx';
const ActionTypes = Constants.ActionTypes;
import * as Client from '../utils/client.jsx';
import * as EventHelpers from '../dispatcher/event_helpers.jsx';
import ModalStore from '../stores/modal_store.jsx';
import UserStore from '../stores/user_store.jsx';
import ChannelStore from '../stores/channel_store.jsx';
import TeamStore from '../stores/team_store.jsx';
import ConfirmModal from './confirm_modal.jsx';

import {intlShape, injectIntl, defineMessages, FormattedMessage, FormattedHTMLMessage} from 'mm-intl';

const Modal = ReactBootstrap.Modal;

const holders = defineMessages({
    emailError: {
        id: 'invite_member.emailError',
        defaultMessage: 'Please enter a valid email address'
    },
    firstname: {
        id: 'invite_member.firstname',
        defaultMessage: 'First name'
    },
    lastname: {
        id: 'invite_member.lastname',
        defaultMessage: 'Last name'
    },
    modalTitle: {
        id: 'invite_member.modalTitle',
        defaultMessage: 'Discard Invitations?'
    },
    modalMessage: {
        id: 'invite_member.modalMessage',
        defaultMessage: 'You have unsent invitations, are you sure you want to discard them?'
    },
    modalButton: {
        id: 'invite_member.modalButton',
        defaultMessage: 'Yes, Discard'
    }
});

class InviteMemberModal extends React.Component {
    constructor(props) {
        super(props);

        this.handleToggle = this.handleToggle.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.addInviteFields = this.addInviteFields.bind(this);
        this.addInviteBulk = this.addInviteBulk.bind(this);
        this.clearFields = this.clearFields.bind(this);
        this.removeInviteFields = this.removeInviteFields.bind(this);
        this.showGetTeamInviteLinkModal = this.showGetTeamInviteLinkModal.bind(this);

        this.state = {
            show: false,
            inviteIds: [0],
            idCount: 0,
            emailErrors: {},
            firstNameErrors: {},
            lastNameErrors: {},
            emailEnabled: global.window.mm_config.SendEmailNotifications === 'true',
            userCreationEnabled: global.window.mm_config.EnableUserCreation === 'true',
            showConfirmModal: false,
            isSendingEmails: false,
            multipleInvite: false,
            addAnotherArea: true,
            bulkEmailsError: false
        };
    }

    componentDidMount() {
        ModalStore.addModalListener(ActionTypes.TOGGLE_INVITE_MEMBER_MODAL, this.handleToggle);
    }

    componentWillUnmount() {
        ModalStore.removeModalListener(ActionTypes.TOGGLE_INVITE_MEMBER_MODAL, this.handleToggle);
    }

    handleToggle(value) {
        this.setState({
            show: value
        });
    }

    handleSubmit() {
        if (!this.state.emailEnabled) {
            return;
        }

        var inviteIds = this.state.inviteIds;
        var count = inviteIds.length;
        var invites = [];
        let emailErrors = this.state.emailErrors;
        var firstNameErrors = this.state.firstNameErrors;
        var lastNameErrors = this.state.lastNameErrors;
        var valid = true;

        for (var ind = 0; ind < count; ind++) {
            var index = inviteIds[ind];
            var invited = {};
            invited.email = ReactDOM.findDOMNode(this.refs['email' + index]).value.trim();
            if (!invited.email || !utils.isEmail(invited.email)) {
                emailErrors[index] = this.props.intl.formatMessage(holders.emailError);
                valid = false;
            } else {
                emailErrors[index] = '';
            }

            invited.firstName = ReactDOM.findDOMNode(this.refs['first_name' + index]).value.trim();

            invited.lastName = ReactDOM.findDOMNode(this.refs['last_name' + index]).value.trim();

            invites.push(invited);
        }
        var emails = [];
        const emailValue = this.refs.addManyPeople ? this.refs.addManyPeople.value : '';
        if (emailValue) {
            emails = emailValue.split(/,|;| |\n/);
        }

        var bulkEmails = 0;
        for (var i = 0; i < emails.length; i++) {
            var invite = {};
            invite.email = emails[i].trim();
            if (invite.email === '') {
                continue;
            }
            if (bulkEmails === 0) {
                emailErrors = [];
                invites = [];
                valid = true;

                /* just to be sure that we got at least one email entered into textarea */
                bulkEmails++;
            }
            if (!invite.email || !utils.isEmail(invite.email)) {
                emailErrors.multiBoxError = this.props.intl.formatMessage(holders.emailError);
                valid = false;
                this.setState({bulkEmailsError: true});
            } else {
                emailErrors.multiBoxError = '';
                this.setState({bulkEmailsError: false});
            }
            invites.push(invite);
        }

        this.setState({emailErrors: emailErrors, firstNameErrors: firstNameErrors, lastNameErrors: lastNameErrors});

        if (!valid || invites.length === 0) {
            return;
        }

        var data = {};
        data.invites = invites;
        this.setState({isSendingEmails: true});

        Client.inviteMembers(
            data,
            () => {
                this.handleHide(false);
                this.setState({isSendingEmails: false});
            },
            (err) => {
                if (err.id === 'api.team.invite_members.already.app_error') {
                    emailErrors[err.detailed_error] = err.message;
                    var emailsAll = this.refs.addManyPeople.value.split(/,|;| |\n/);
                    if (emailsAll.length > 0 && this.state.multipleInvite) {
                        emailErrors[err.detailed_error] += ': ' + emailsAll[err.detailed_error];
                    }
                    this.setState({emailErrors: emailErrors});
                } else {
                    this.setState({serverError: err.message});
                }

                this.setState({isSendingEmails: false});
            }
        );
    }

    showInitialModal() {
        $('.addAnotherFieldsArea').show();
        this.setState({multipleInvite: false, addAnotherArea: true});
    }

    handleHide(requireConfirm, cancelClick) {
        if (this.state.multipleInvite && cancelClick) {
            if (this.refs.addManyPeople.value.trim() !== '' && requireConfirm) {
                this.setState({
                    showConfirmModal: true
                });
            } else {
                this.showInitialModal();
                this.setState({
                    showConfirmModal: false
                });
            }
        } else {
            if (requireConfirm) {
                var notEmpty = false;
                for (var i = 0; i < this.state.inviteIds.length; i++) {
                    var index = this.state.inviteIds[i];
                    if (ReactDOM.findDOMNode(this.refs['email' + index]).value.trim() !== '') {
                        notEmpty = true;
                        break;
                    }
                }

                if (notEmpty) {
                    this.setState({
                        showConfirmModal: true
                    });
                    return;
                }
            }

            this.clearFields();
            this.setState({
                show: false,
                showConfirmModal: false,
                multipleInvite: false,
                addAnotherArea: true
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.show && this.state.show) {
            $(ReactDOM.findDOMNode(this.refs.modalBody)).css('max-height', $(window).height() - 200);
            if ($(window).width() > 768) {
                $(ReactDOM.findDOMNode(this.refs.modalBody)).perfectScrollbar();
            }
        }
    }

    addInviteFields() {
        var count = this.state.idCount + 1;
        var inviteIds = this.state.inviteIds;
        inviteIds.push(count);

        this.setState({inviteIds: inviteIds, idCount: count});
    }

    addInviteBulk() {
        $('.addAnotherFieldsArea').hide();
        this.setState({multipleInvite: true, addAnotherArea: false});
    }

    clearFields() {
        var inviteIds = this.state.inviteIds;
        if (this.refs.addManyPeople) {
            this.refs.addManyPeople.value = '';
        }

        for (var i = 0; i < inviteIds.length; i++) {
            var index = inviteIds[i];
            ReactDOM.findDOMNode(this.refs['email' + index]).value = '';
            ReactDOM.findDOMNode(this.refs['first_name' + index]).value = '';
            ReactDOM.findDOMNode(this.refs['last_name' + index]).value = '';
        }

        this.setState({
            inviteIds: [0],
            idCount: 0,
            emailErrors: {},
            firstNameErrors: {},
            lastNameErrors: {}
        });
    }
    removeInviteFields(index) {
        var count = this.state.idCount;
        var inviteIds = this.state.inviteIds;
        var i = inviteIds.indexOf(index);
        if (i > -1) {
            inviteIds.splice(i, 1);
        }
        if (!inviteIds.length) {
            inviteIds.push(++count);
        }
        this.setState({inviteIds: inviteIds, idCount: count});
    }

    showGetTeamInviteLinkModal() {
        this.handleHide(false);

        EventHelpers.showGetTeamInviteLinkModal();
    }

    render() {
        var currentUser = UserStore.getCurrentUser();
        const {formatMessage} = this.props.intl;

        if (currentUser !== null) {
            var inviteSections = [];
            var inviteIds = this.state.inviteIds;
            for (var i = 0; i < inviteIds.length; i++) {
                var index = inviteIds[i];
                var emailError = null;
                if (this.state.emailErrors[index]) {
                    emailError = <label className='control-label'>{this.state.emailErrors[index]}</label>;
                }
                var firstNameError = null;
                if (this.state.firstNameErrors[index]) {
                    firstNameError = <label className='control-label'>{this.state.firstNameErrors[index]}</label>;
                }
                var lastNameError = null;
                if (this.state.lastNameErrors[index]) {
                    lastNameError = <label className='control-label'>{this.state.lastNameErrors[index]}</label>;
                }

                var removeButton = null;
                if (index) {
                    removeButton = (<div>
                                        <button
                                            type='button'
                                            className='btn btn-link remove__member'
                                            onClick={this.removeInviteFields.bind(this, index)}
                                        >
                                            <span className='fa fa-trash'></span>
                                        </button>
                                    </div>);
                }
                var emailClass = 'form-group invite';
                if (emailError) {
                    emailClass += ' has-error';
                }

                var nameFields = null;

                var firstNameClass = 'form-group';
                if (firstNameError) {
                    firstNameClass += ' has-error';
                }
                var lastNameClass = 'form-group';
                if (lastNameError) {
                    lastNameClass += ' has-error';
                }
                nameFields = (<div className='row--invite'>
                                <div className='col-sm-6'>
                                    <div className={firstNameClass}>
                                        <input
                                            type='text'
                                            className='form-control'
                                            ref={'first_name' + index}
                                            placeholder={formatMessage(holders.firstname)}
                                            maxLength='64'
                                            disabled={!this.state.emailEnabled || !this.state.userCreationEnabled}
                                            spellCheck='false'
                                        />
                                        {firstNameError}
                                    </div>
                                </div>
                                <div className='col-sm-6'>
                                    <div className={lastNameClass}>
                                        <input
                                            type='text'
                                            className='form-control'
                                            ref={'last_name' + index}
                                            placeholder={formatMessage(holders.lastname)}
                                            maxLength='64'
                                            disabled={!this.state.emailEnabled || !this.state.userCreationEnabled}
                                            spellCheck='false'
                                        />
                                        {lastNameError}
                                    </div>
                                </div>
                            </div>);

                inviteSections[index] = (
                    <div className='addAnotherFieldsArea'
                        key={'addAnotherFieldsAreaKey' + index}
                    >
                    <div key={'key' + index}>
                    {removeButton}
                    <div className={emailClass}>
                        <input
                            onKeyUp={this.displayNameKeyUp}
                            type='text'
                            ref={'email' + index}
                            className='form-control'
                            placeholder='email@domain.com'
                            maxLength='64'
                            disabled={!this.state.emailEnabled || !this.state.userCreationEnabled}
                            spellCheck='false'
                        />
                        {emailError}
                    </div>
                    {nameFields}
                    </div>
                    </div>
                );
            }

            var serverError = null;
            if (this.state.serverError) {
                serverError = <div className='form-group has-error'><label className='control-label'>{this.state.serverError}</label></div>;
            }

            var content = null;
            var sendButton = null;

            var defaultChannelName = '';
            if (ChannelStore.getByName(Constants.DEFAULT_CHANNEL)) {
                defaultChannelName = ChannelStore.getByName(Constants.DEFAULT_CHANNEL).display_name;
            }

            var teamInviteLink = null;
            if (currentUser && TeamStore.getCurrent().type === 'O') {
                var link = (
                    <a
                        href='#'
                        onClick={this.showGetTeamInviteLinkModal}
                    >
                        <FormattedMessage
                            id='invite_member.inviteLink'
                            defaultMessage='Team Invite Link'
                        />
                    </a>
                );

                teamInviteLink = (
                    <p>
                        <FormattedMessage
                            id='invite_member.teamInviteLink'
                            defaultMessage='You can also invite people using the {link}.'
                            values={{
                                link: (link)
                            }}
                        />
                    </p>
                );
            }

            if (this.state.emailEnabled && this.state.userCreationEnabled) {
                content = (
                    <div>
                        {serverError}
                        {
                            this.state.addAnotherArea ?
                                <div id='addAnotherArea'>
                                    <button
                                        type='button'
                                        className='btn btn-default'
                                        onClick={this.addInviteFields}
                                    >
                                        <FormattedMessage
                                            id='invite_member.addAnother'
                                            defaultMessage='Add another'
                                        />
                                    </button>
                                    &nbsp;&nbsp;&nbsp;
                                    <button
                                        type='button'
                                        className='btn btn-default'
                                        onClick={this.addInviteBulk}
                                    >
                                        <FormattedMessage
                                            id='invite_member.addMany'
                                            defaultMessage='Add many people at once'
                                        />
                                    </button>
                                    &nbsp;&nbsp;&nbsp;
                                    {teamInviteLink}
                                </div> : null
                        }
                        {
                        this.state.multipleInvite ?
                            <div
                                id='addManyPeopleArea'
                                className='row--invite'
                            >
                                {this.state.bulkEmailsError ?
                                    <div className='form-group invite has-error'
                                        id='bulkEmailsError'
                                    >
                                        <label className='control-label'>{this.state.emailErrors.multiBoxError}</label>
                                    </div> : null
                                }
                                <FormattedMessage
                                    id='invite_member.addMultipleEmails'
                                    defaultMessage='Add multiple email addresses'
                                />
                            <textarea
                                id='addManyPeople'
                                ref='addManyPeople'
                                rows='5'
                                className='col-sm-12 form-control'
                            >
                            </textarea>
                        </div> : null
                        }

                        <br/>
                        <span>
                            <FormattedHTMLMessage
                                id='invite_member.autoJoin'
                                defaultMessage='People invited automatically join the <strong>{channel}</strong> channel.'
                                values={{
                                    channel: defaultChannelName
                                }}
                            />
                        </span>
                    </div>
                );

                var sendButtonLabel = (
                    <FormattedMessage
                        id='invite_member.send'
                        defaultMessage='Send Invitation'
                    />
                );
                if (this.state.isSendingEmails) {
                    sendButtonLabel = (
                        <span><i className='fa fa-spinner fa-spin'/>
                            <FormattedMessage
                                id='invite_member.sending'
                                defaultMessage=' Sending'
                            />
                        </span>
                    );
                } else if (this.state.inviteIds.length > 1) {
                    sendButtonLabel = (
                        <FormattedMessage
                            id='invite_member.send2'
                            defaultMessage='Send Invitations'
                        />
                    );
                }

                sendButton = (
                    <button
                        onClick={this.handleSubmit}
                        type='button'
                        className='btn btn-primary'
                        disabled={this.state.isSendingEmails}
                    >
                        {sendButtonLabel}
                    </button>
                );
            } else if (this.state.userCreationEnabled) {
                content = (
                    <div>
                        <p>
                            <FormattedMessage
                                id='invite_member.content'
                                defaultMessage='Email is currently disabled for your team, and email invitations cannot be sent. Contact your system administrator to enable email and email invitations.'
                            />
                        </p>
                        {teamInviteLink}
                    </div>
                );
            } else {
                content = (
                    <div>
                        <p>
                            <FormattedMessage
                                id='invite_member.disabled'
                                defaultMessage='User creation has been disabled for your team. Please ask your team administrator for details.'
                            />
                        </p>
                    </div>
                );
            }

            return (
                <div>
                    <Modal
                        dialogClassName='modal-invite-member'
                        show={this.state.show}
                        onHide={this.handleHide.bind(this, true, false)}
                        enforceFocus={!this.state.showConfirmModal}
                        backdrop={this.state.isSendingEmails ? 'static' : true}
                    >
                        <Modal.Header closeButton={!this.state.isSendingEmails}>
                            <Modal.Title>
                                <FormattedMessage
                                    id='invite_member.newMember'
                                    defaultMessage='Invite New Member'
                                />
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body ref='modalBody'>
                            <form role='form'>
                                {inviteSections}
                            </form>
                            {content}
                        </Modal.Body>
                        <Modal.Footer>
                            <button
                                type='button'
                                className='btn btn-default'
                                onClick={this.handleHide.bind(this, true, true)}
                                disabled={this.state.isSendingEmails}
                            >
                                <FormattedMessage
                                    id='invite_member.cancel'
                                    defaultMessage='Cancel'
                                />
                            </button>
                            {sendButton}
                        </Modal.Footer>
                    </Modal>
                    <ConfirmModal
                        title={formatMessage(holders.modalTitle)}
                        message={formatMessage(holders.modalMessage)}
                        confirmButton={formatMessage(holders.modalButton)}
                        show={this.state.showConfirmModal}
                        onConfirm={this.handleHide.bind(this, false)}
                        onCancel={() => this.setState({showConfirmModal: false})}
                    />
                </div>
            );
        }

        return null;
    }
}

InviteMemberModal.propTypes = {
    intl: intlShape.isRequired
};

export default injectIntl(InviteMemberModal);
