import FilteredUserList from './filtered_user_list.jsx';
import LoadingScreen from './loading_screen.jsx';

import UserStore from '../stores/user_store.jsx';
import ChannelStore from '../stores/channel_store.jsx';

import * as Utils from '../utils/utils.jsx';
import * as Client from '../utils/client.jsx';
import * as AsyncClient from '../utils/async_client.jsx';
import ConfirmModal from './confirm_modal.jsx';

import {FormattedMessage, injectIntl, intlShape, defineMessages} from 'mm-intl';

const Modal = ReactBootstrap.Modal;
const holders = defineMessages({

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

export default class ChannelInviteModal extends React.Component {
    constructor() {
        super();

        this.onListenerChange = this.onListenerChange.bind(this);
        this.handleInvite = this.handleInvite.bind(this);

        this.createInviteButton = this.createInviteButton.bind(this);
        this.showCancelButton = this.showCancelButton.bind(this);
        this.showCopyLink = this.showCopyLink.bind(this);
        this.hideCopyLink = this.hideCopyLink.bind(this);
        this.hideCancelButton = this.hideCancelButton.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.closeButton = this.closeButton.bind(this);
        this.copyLink = this.copyLink.bind(this);

        // the state gets populated when the modal is shown
        this.state = {
            loading: true,
            showCancelButton: false,
            showCopyButton: false,
            copiedLink: false,
            showConfirmModal: false
        };
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.show && !nextProps.show) {
            return false;
        }

        if (!Utils.areObjectsEqual(this.props, nextProps)) {
            return true;
        }

        if (!Utils.areObjectsEqual(this.state, nextState)) {
            return true;
        }

        return false;
    }

    handleHide(confirm) {
        if (confirm) {
            this.setState({
                showConfirmModal: false,
                showCopyButton: false,
                copiedLink: false,
                showCancelButton: false
            });
            this.props.onHide();
        } else {
            this.setState({
                showConfirmModal: true
            });
        }
    }

    getStateFromStores() {
        const users = UserStore.getActiveOnlyProfiles();

        if ($.isEmptyObject(users)) {
            return {
                loading: true
            };
        }

        // make sure we have all members of this channel before rendering
        const extraInfo = ChannelStore.getCurrentExtraInfo();
        if (extraInfo.member_count !== extraInfo.members.length) {
            AsyncClient.getChannelExtraInfo(this.props.channel.id, -1);

            return {
                loading: true
            };
        }

        const memberIds = extraInfo.members.map((user) => user.id);

        var nonmembers = [];
        for (var id in users) {
            if (memberIds.indexOf(id) === -1) {
                nonmembers.push(users[id]);
            }
        }

        nonmembers.sort((a, b) => {
            return a.username.localeCompare(b.username);
        });

        return {
            nonmembers,
            loading: false
        };
    }
    componentWillReceiveProps(nextProps) {
        if (!this.props.show && nextProps.show) {
            ChannelStore.addExtraInfoChangeListener(this.onListenerChange);
            ChannelStore.addChangeListener(this.onListenerChange);
            UserStore.addChangeListener(this.onListenerChange);
            this.onListenerChange();
        } else if (this.props.show && !nextProps.show) {
            ChannelStore.removeExtraInfoChangeListener(this.onListenerChange);
            ChannelStore.removeChangeListener(this.onListenerChange);
            UserStore.removeChangeListener(this.onListenerChange);
        }
    }
    onListenerChange() {
        var newState = this.getStateFromStores();
        if (!Utils.areObjectsEqual(this.state, newState)) {
            this.setState(newState);
        }
    }
    handleInvite(user) {
        const data = {
            user_id: user.id
        };

        Client.addChannelMember(
            this.props.channel.id,
            data,
            () => {
                this.setState({inviteError: null});
                AsyncClient.getChannelExtraInfo();
            },
            (err) => {
                this.setState({inviteError: err.message});
            }
        );
    }

    //hiding cancel button from model
    showCancelButton() {
        if (!this.state.showCancelButton) {
            this.setState({
                showCancelButton: true
            });
        }
    }

    //copy channel invite link
    showCopyLink() {
        if (!this.state.showCopyButton) {
            this.setState({
                showCopyButton: true
            });
        }
    }

    hideCopyLink() {
        if (this.state.showCopyButton) {
            this.setState({
                showCopyButton: false
            });
        }
    }

    hideCancelButton() {
        this.setState({
            showCopyButton: false,
            showCancelButton: false
        });
    }

    closeButton() {
        //checking for any entry in textarea for inviting member
        if ($('#recently_invited_email').val() && $('#recently_invited_email').val().trim()) {
            this.handleHide();
        } else {
            this.props.onHide();
            this.setState({
                showCopyButton: false,
                copiedLink: false,
                showCancelButton: false
            });
        }
    }

    copyLink() {
        this.props.onHide();
        var copyTextarea = $(ReactDOM.findDOMNode(this.refs.textarea));
        copyTextarea.select();

        try {
            var successful = document.execCommand('copy');
            if (successful) {
                this.setState({copiedLink: true});
            } else {
                this.setState({copiedLink: false});
            }
        } catch (err) {
            this.setState({copiedLink: false});
        }
    }

    createInviteButton({user}) {
        return (
            <a
                onClick={this.handleInvite.bind(this, user)}
                className='btn btn-sm btn-primary'
            >
                <i className='glyphicon glyphicon-envelope'/>
                <FormattedMessage
                    id='channel_invite.add'
                    defaultMessage=' Add'
                />
            </a>
        );
    }
    render() {
        const {formatMessage} = this.props.intl;
        var inviteError = null;
        if (this.state.inviteError) {
            inviteError = (<label className='has-error control-label'>{this.state.inviteError}</label>);
        }

        let copyLink = null;
        if (document.queryCommandSupported('copy') && this.state.showCopyButton) {
            copyLink = (
                <button
                    data-copy-btn='true'
                    type='button'
                    className='btn btn-primary pull-left'
                    onClick={this.copyLink}
                >
                    <FormattedMessage
                        id='channel_modal.copy'
                        defaultMessage='Copy Link'
                    />
                </button>
            );
        }

        let copyLinkConfirm = null;
        if (this.state.copiedLink) {
            copyLinkConfirm = (
                <p className='alert alert-success copy-link-confirm'>
                    <i className='fa fa-check'></i>
                    <FormattedMessage
                        id='channel_modal.clipboard'
                        defaultMessage=' Link copied to clipboard.'
                    />
                </p>
            );
        }

        var content;
        if (this.state.loading) {
            content = (<LoadingScreen/>);
        } else {
            let maxHeight = 1000;
            if (Utils.windowHeight() <= 1200) {
                maxHeight = Utils.windowHeight() - 300;
            }

            content = (
                <FilteredUserList
                    style={{maxHeight}}
                    users={this.state.nonmembers}
                    actions={[this.createInviteButton]}
                    showCancel={this.showCancelButton}
                    showInitialState={this.state.showCancelButton}
                    showCopyLink={this.showCopyLink}
                    hideCopyLink={this.hideCopyLink}
                    context='inviteMember'
                />
            );
        }

        return (
            <div>
                <Modal
                    dialogClassName='more-modal'
                    show={this.props.show}
                    onHide={this.props.onHide}
                    backdrop={this.state.isInviting ? 'static' : true}
                >
                    <Modal.Header closeButton={true}>
                        <Modal.Title>
                            <FormattedMessage
                                id='channel_invite.addNewMembers'
                                defaultMessage='Add New Members to '
                            />
                            <span className='name'>{this.props.channel.display_name}</span>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {inviteError}
                        {content}
                    </Modal.Body>
                    <Modal.Footer>
                        {copyLink}
                        {copyLinkConfirm}
                        {
                            this.state.showCancelButton ?
                                <button
                                    type='button'
                                    className='btn btn-default'
                                    onClick={this.hideCancelButton}
                                >
                                    <FormattedMessage
                                        id='channel_invite.cancel'
                                        defaultMessage='Cancel'
                                    />
                                </button> : null
                        }
                        <button
                            type='button'
                            className='btn btn-default'
                            onClick={this.closeButton}
                        >
                            <FormattedMessage
                                id='channel_invite.close'
                                defaultMessage='Close'
                            />
                        </button>
                    </Modal.Footer>
                </Modal>
                <ConfirmModal
                    title={formatMessage(holders.modalTitle)}
                    message={formatMessage(holders.modalMessage)}
                    confirmButton={formatMessage(holders.modalButton)}
                    show={this.state.showConfirmModal}
                    onConfirm={this.handleHide.bind(this, true)}
                    onCancel={() => this.setState({showConfirmModal: false})}
                />
            </div>

        );
    }
}

ChannelInviteModal.propTypes = {
    show: React.PropTypes.bool.isRequired,
    onHide: React.PropTypes.func.isRequired,
    channel: React.PropTypes.object.isRequired,
    intl: intlShape.isRequired
};
export default injectIntl(ChannelInviteModal);
