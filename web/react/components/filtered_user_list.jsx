// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import UserList from './user_list.jsx';
import * as Client from '../utils/client.jsx';

import {intlShape, injectIntl, defineMessages, FormattedMessage} from 'mm-intl';

const holders = defineMessages({
    member: {
        id: 'filtered_user_list.member',
        defaultMessage: 'Member'
    },
    search: {
        id: 'filtered_user_list.search',
        defaultMessage: 'Search members'
    },
    selectAll: {
        id: 'filtered_user_list.selectAll',
        defaultMessage: 'Select All'
    },
    multipleEmail: {
        id: 'filtered_user_list.multipleEmail',
        deafaultMessage: 'Type email addresses here or select from the emails listed below'
    }
});

class FilteredUserList extends React.Component {
    constructor(props) {
        super(props);

        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.pillClicked = this.pillClicked.bind(this);

        this.state = {
            filter: '',
            inviteData: [],
            showAllUsers: true,
            searchMembers: '',
            checked: false,
            invitedState: [],
            addedState: [],
            checkAllInvited: false,
            checkAllAdded: false,
            tabClicked: false,
            addedSection: false,
            invitedSection: false,
            hideRecentlyAdded: false,
            hideRecentlyInvited: false
        };

        this.invitedList = [];
        this.addedList = [];
        this.recently_added_arr = [];
        this.recently_invited_arr = [];
    }

    componentWillMount() {
        //call to get recently added and invited user list. saving members ro separate array
        $(ReactDOM.findDOMNode(this.refs.userList)).perfectScrollbar();
        Client.recentlyInvitedAndAdded(
            (success) => {
                this.setState({
                    inviteData: success
                }, () => {
                    const invitedStates = [];
                    const addedStates = [];
                    this.state.inviteData.forEach((data, index) => {
                        if (data.type === 'invited') {
                            this.recently_invited_arr.push(data);
                            invitedStates[index] = false;
                        }
                        if (data.type === 'added') {
                            this.recently_added_arr.push(data);
                            addedStates[index] = false;
                        }
                    });
                    this.setState({
                        invitedState: invitedStates,
                        addedState: addedStates
                    });
                });
            },
            () => {
               // console.log(err);
            }
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filter !== this.state.filter) {
            $(ReactDOM.findDOMNode(this.refs.userList)).scrollTop(0);
        }
        $('.invited-label', ReactDOM.findDOMNode(this)).tooltip();
        $('.added-label', ReactDOM.findDOMNode(this)).tooltip();
    }

    handleFilterChange(e) {
        this.setState({
            filter: e.target.value
        });
    }

    //to hide and show respective footer button
    pillClicked(component) {
        if (component === 'added') {
            this.setState({
                invitedSection: false,
                addedSection: true
            });
        }
        if (component === 'invited') {
            this.setState({
                invitedSection: true,
                addedSection: false
            });
        }

        if (component === 'link') {
            this.props.showCopyLink();
            this.setState({
                invitedSection: false,
                addedSection: false
            });
        } else {
            this.props.hideCopyLink();
        }
        if (this.state.showAllUsers) {
            this.setState({
                showAllUsers: false
            });
        }
        this.props.showCancel();
        this.checkLength(true);
        this.setState({
            tabClicked: true
        });
    }

    //This method is for to toggle recently invited member checkbox and get selected/checked value in an array

    toggleCheckboxInvited(checkedIndex, event) {
        let checkedInfo;
        if (this.state.checkAllInvited) {
            checkedInfo = !this.state.checkAllInvited;
        }

        const value = event.target.value;
        const copyInvitedState = this.state.invitedState;
        copyInvitedState[checkedIndex] = event.target.checked;

        if (event.target.checked) {
            this.invitedList.push(value);
        } else {
            const index = this.invitedList.indexOf(value);
            this.invitedList.splice(index, 1);
        }

        this.setState({
            checkAllInvited: checkedInfo,
            invitedState: copyInvitedState
        });
    }

    //This method is for to toggle recently added checkbox and get selected/checked value in an array

    toggleCheckboxAdded(checkedIndex, event) {
        let checkedInfo;
        if (this.state.checkAllAdded) {
            checkedInfo = !this.state.checkAllAdded;
        }

        const value = event.target.value;
        const copyAddedState = this.state.addedState;
        copyAddedState[checkedIndex] = event.target.checked;
        if (event.target.checked) {
            this.addedList.push(value);
        } else {
            const index = this.addedList.indexOf(value);
            this.addedList.splice(index, 1);
        }

        this.setState({
            checkAllAdded: checkedInfo,
            addedState: copyAddedState
        });
    }

    //This method is for inviting all selected recently invited member to the channel
    //call for recently invited and recently added are separate.
    selectAllInvited(event) {
        const invitedStates = [];
        this.invitedList = [];

        if (event.target.checked) {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'invited') {
                    invitedStates[index] = true;
                    this.invitedList.push(data.email);
                }
            });
        } else {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'invited') {
                    invitedStates[index] = false;
                }
            });
        }

        this.setState({
            checkAllInvited: event.target.checked,
            invitedState: invitedStates
        });
    }

    //This method is for inviting all selected recently invited member to the channel
    selectAllAdded(event) {
        const addedStates = [];
        this.addedList = [];
        if (event.target.checked) {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'added') {
                    addedStates[index] = true;
                    this.addedList.push(data.email);
                }
            });
        } else {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'added') {
                    addedStates[index] = false;
                }
            });
        }

        this.setState({
            checkAllAdded: event.target.checked,
            addedState: addedStates
        });
    }

    //Api call for sending selected recently added member
    inviteAddedMember() {
        const data = {invites: []};
        this.addedList.forEach((mail) => {
            data.invites.push({email: mail});
        });
        Client.inviteMembersToChannel(
            data,
            () => {//success
            },
            () => {
                //err
            }
        );
    }

    //Api call for sending selected recently invited member
    inviteSelected() {
        let emailList;
        const joinAllArray = [];
        const textEmail = ReactDOM.findDOMNode(this.refs.recently_invited_email).value;
        if (textEmail) {
            emailList = textEmail.split(/,|;| |\n/);
        }
        emailList = this.invitedList.concat(emailList);

        for (let i = 0; i < emailList.length; i++) {
            if (/\S/.test(emailList[i])) {
                joinAllArray.push($.trim(emailList[i]));
            }
        }
        const data = {invites: []};
        joinAllArray.forEach((mail) => {
            data.invites.push({email: mail});
        });

        Client.inviteMembersToChannel(
            data,
            () => {//success
            },
            () => {
                //err
            }
        );
    }

    componentWillReceiveProps(newProps) {
        //Removing active class from tabs
        //Jquery way need to replaced with react
        if (!newProps.showInitialState) {
            $('#recently_invited, #recently_added,#get_link').removeClass('active');
            $('.pill-list').removeClass('active');
            this.setState({
                showAllUsers: true,
                tabClicked: false
            });
        }
    }

    checkLength() {
        if (this.recently_added_arr && !this.recently_added_arr.length) {
            this.setState({
                hideRecentlyAdded: true
            });
        }
        if (this.recently_invited_arr && !this.recently_invited_arr.length) {
            this.setState({
                hideRecentlyInvited: true
            });
        }
    }

    render() {
        const {formatMessage} = this.props.intl;
        let users = this.props.users;
        if (this.state.filter) {
            const filter = this.state.filter.toLowerCase();

            users = users.filter((user) => {
                return user.username.toLowerCase().indexOf(filter) !== -1 ||
                    (user.first_name && user.first_name.toLowerCase().indexOf(filter) !== -1) ||
                    (user.last_name && user.last_name.toLowerCase().indexOf(filter) !== -1) ||
                    (user.nickname && user.nickname.toLowerCase().indexOf(filter) !== -1);
            });
        }

        let count;

        //For tab section
        if (this.state.tabClicked) {
            if (this.state.invitedSection) {
                const invited = this.recently_invited_arr.filter((user) => {
                    const regex = new RegExp(this.state.filter, 'gi');
                    return this.state.filter ? (user.email.match(regex)) : user;
                });
                if (invited.length === this.recently_invited_arr.length) {
                    count = (
                        <FormattedMessage
                            id='filtered_user_list.count'
                            defaultMessage='{count} {count, plural,
                                one {member}
                                other {members}
                        }'
                            values={{
                                count: invited.length
                            }}
                        />
                    );
                } else {
                    count = (
                        <FormattedMessage
                            id='filtered_user_list.countTotal'
                            defaultMessage='{count} {count, plural,
                                one {member}
                                other {members}
                            } of {total} Total'
                            values={{
                                count: invited.length,
                                total: this.recently_invited_arr.length
                            }}
                        />
                    );
                }
            } else if (this.state.addedSection) {
                const added = this.recently_added_arr.filter((user) => {
                    const regex = new RegExp(this.state.filter, 'gi');
                    return this.state.filter ? (user.email.match(regex)) : user;
                });

                if (added.length === this.recently_added_arr.length) {
                    count = (
                        <FormattedMessage
                            id='filtered_user_list.count'
                            defaultMessage='{count} {count, plural,
                                one {member}
                                other {members}
                        }'
                            values={{
                                count: added.length
                            }}
                        />
                    );
                } else {
                    count = (
                        <FormattedMessage
                            id='filtered_user_list.countTotal'
                            defaultMessage='{count} {count, plural,
                                one {member}
                                other {members}
                            } of {total} Total'
                            values={{
                                count: added.length,
                                total: this.recently_added_arr.length
                            }}
                        />
                    );
                }
            }
        } else {
            //user section
            const len = users.length;
            if (len === this.props.users.length) {
                count = (
                    <FormattedMessage
                        id='filtered_user_list.count'
                        defaultMessage='{count} {count, plural,
                     one {member}
                     other {members}
                    }'
                        values={{
                            count: users.length
                        }}
                    />
                );
            } else {
                count = (
                    <FormattedMessage
                        id='filtered_user_list.countTotal'
                        defaultMessage='{count} {count, plural,
                    one {member}
                    other {members}
                } of {total} Total'
                        values={{
                            count: users.length,
                            total: this.props.users.length
                        }}
                    />
                );
            }
        }

        return (
            <div
                className='filtered-user-list'
                style={this.props.style}
            >
                <div className='channel-filter-row filter-row '>
                    <div className='col-sm-6'>
                        <input
                            ref='filter'
                            className='form-control filter-textbox'
                            placeholder={formatMessage(holders.search)}
                            onInput={this.handleFilterChange}
                        />
                    </div>
                    <div className='col-sm-6'>
                        <span className='member-count'>{count}</span>
                    </div>
                </div>
                <div>
                    {this.props.context === 'inviteMember' ?
                        <ul className='team-nav nav nav-tabs'>
                            <li>
                                <a data-toggle='tab'
                                    href='#recently_added'
                                    onClick={this.pillClicked.bind(this, 'added')}
                                >
                                    <FormattedMessage
                                        id='filtered_user_list.added'
                                        defaultMessage='Recently Added'
                                    />
                                </a>
                            </li>
                            <li>
                                <a data-toggle='tab'
                                    href='#recently_invited'
                                    onClick={this.pillClicked.bind(this, 'invited')}
                                >
                                    <FormattedMessage
                                        id='filtered_user_list.invited'
                                        defaultMessage='Recently Invited'
                                    />
                                </a>
                            </li>
                            <li>
                                <a data-toggle='tab'
                                    href='#get_link'
                                    onClick={this.pillClicked.bind(this, 'link')}
                                >
                                    <FormattedMessage
                                        id='filtered_user_list.getLink'
                                        defaultMessage='Get Link'
                                    />
                                </a>
                            </li>
                        </ul> : null
                    }
                    {

                    }
                    <div className={`tab-content invite-checkox-section ${this.state.tabClicked === false ? 'hide-tag' : ''}`}>
                        <div id='recently_added'
                            className='tab-pane fade'
                        >
                            <div className={`all_added ${this.state.hideRecentlyAdded ? 'hide-checkbox' : ''}`}>
                                <input
                                    type='checkbox'
                                    checked={this.state.checkAllAdded}
                                    onChange={this.selectAllAdded.bind(this)}
                                    name='select_all'
                                    value='all_added'
                                    id='all_added'
                                />
                                <label htmlFor='all_added'>
                                    <FormattedMessage
                                        id='filtered_user_list.selectAdded'
                                        defaultMessage='Select All'
                                    />
                                </label>
                                <br/>
                                <button
                                    type='button'
                                    className='recently_added_btn btn btn-primary'
                                    onClick={this.inviteAddedMember.bind(this)}
                                >
                                    <FormattedMessage
                                        id='filtered_user_list.add'
                                        defaultMessage='Add'
                                    />
                                </button>
                            </div>
                            <br/>
                            {this.recently_added_arr && this.recently_added_arr.length ?
                                <div>
                                {
                                    this.recently_added_arr.slice(0, 20).map((obj, index) => {
                                        return (
                                            <div className='col-md-4 col-xs-4'
                                                key={index}
                                            >
                                                <input checked={this.state.addedState[index]}
                                                    type='checkbox'
                                                    id={index}
                                                    name={obj.email}
                                                    value={obj.email}
                                                    onChange={this.toggleCheckboxAdded.bind(this, index)}
                                                />
                                                <label
                                                    htmlFor={index}
                                                    className='added-label'
                                                    title={obj.email}
                                                >{obj.email}</label>
                                            </div>
                                        );
                                    })
                                }
                                </div> : <div>No recently added member:)</div>
                            }
                        </div>
                        <div id='recently_invited'
                            className='tab-pane  fade'
                        >
                                <textarea id='recently_invited_email'
                                    rows='3'
                                    cols='50'
                                    ref='recently_invited_email'
                                    className='form-control no-resize'
                                    placeholder={formatMessage(holders.multipleEmail)}
                                >
                                </textarea>

                                <button type='button'
                                    onClick={this.inviteSelected.bind(this)}
                                    className='btn btn-primary multiple-invited'
                                >
                                    <FormattedMessage
                                        id='filtered_user_list.selectInvited'
                                        defaultMessage='Send'
                                    />
                                </button>

                            <br/>
                        <div className={`aa ${this.state.hideRecentlyInvited ? 'hide-checkbox' : ''}`}>
                            <input checked={this.state.checkAllInvited}
                                onChange={this.selectAllInvited.bind(this)}
                                type='checkbox'
                                name='select_all'
                                value='all_users'
                                id='all-invited'
                            />
                            <label htmlFor='all-invited'>
                                <FormattedMessage
                                    id='filtered_user_list.selectInvited'
                                    defaultMessage='Select All'
                                />
                            </label>
                        </div>

                            {this.recently_invited_arr && this.recently_invited_arr.length ?
                                <div>
                                    {
                                        this.recently_invited_arr.filter((user) => {
                                            const regex = new RegExp(this.state.filter, 'gi');
                                            return this.state.filter ? (user.email.match(regex)) : user;
                                        }).map((obj, index) => {
                                            return (
                                                <div className='col-md-4 col-xs-4 selectable'
                                                    key={index}
                                                >
                                                    <input checked={this.state.invitedState[index]}
                                                        type='checkbox'
                                                        id={index}
                                                        name={obj.email}
                                                        value={obj.email}
                                                        onChange={this.toggleCheckboxInvited.bind(this, index)}
                                                    />
                                                    <label
                                                        htmlFor={index}
                                                        className='invited-label'
                                                        title={obj.email}
                                                    >{obj.email}</label>
                                                </div>
                                            );
                                        })
                                    }
                                </div> : <div>No recently invited users :(</div>
                            }
                        </div>
                        <div
                            id='get_link'
                            className='tab-pane fade'
                        >
                            <textarea
                                className='form-control no-resize min-height'
                                readOnly='true'
                                ref='textarea'
                                value='qwerty'
                            />
                        </div>
                    </div>
                </div>
                {
                    this.state.showAllUsers ?
                        <div
                            ref='userList'
                            className='user-list'
                        >
                            <UserList
                                users={users}
                                actions={this.props.actions}
                            />
                        </div> : null
                }
            </div>
        );
    }
}

FilteredUserList.defaultProps = {
    users: [],
    actions: []
};

FilteredUserList.propTypes = {
    intl: intlShape.isRequired,
    users: React.PropTypes.arrayOf(React.PropTypes.object),
    actions: React.PropTypes.arrayOf(React.PropTypes.func),
    style: React.PropTypes.object,
    showCopyLink: React.PropTypes.func,
    hideCopyLink: React.PropTypes.func,
    context: React.PropTypes.string,
    showCancel: React.PropTypes.func
};

export default injectIntl(FilteredUserList);
