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
        this.loadMoreMember = this.loadMoreMember.bind(this);

        // var invite =[];

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
            limitOfMember: 3
        };

        this.invitedList = [];
        this.addedList = [];
        this.recently_added_arr = [];
        this.recently_invited_arr = [];
    }

    componentWillMount() {
        $(ReactDOM.findDOMNode(this.refs.userList)).perfectScrollbar();
        Client.recentlyInvitedAndAdded(

            (success) => {
                this.setState({
                    inviteData: success
                }, () => {
                    this.state.inviteData.forEach((data, index) => {
                        if (data.type === 'invited') {
                            this.recently_invited_arr.push(data);
                            this.state.invitedState[index] = false;
                        }
                        if (data.type === 'added') {
                            this.recently_added_arr.push(data);
                            this.state.addedState[index] = false;
                        }
                    });
                });
            },
            (err) => {
               // console.log(err);
            }
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filter !== this.state.filter) {
            $(ReactDOM.findDOMNode(this.refs.userList)).scrollTop(0);
        }
    }

    handleFilterChange(e) {
        this.setState({
            filter: e.target.value
        });
    }

    pillClicked(component) {
        if (component === 'link') {
            this.props.showCopyLink();
        } else {
            this.props.hideCopyLink();
        }
        if (this.state.showAllUsers) {
            this.setState({
                showAllUsers: false
            });
        }
        this.props.showCancel();
    }

    toggleCheckboxInvited(checkedIndex, event) {
        if (this.state.checkAllInvited) {
            this.state.checkAllInvited = !this.state.checkAllInvited;
        }

        let value = event.target.value;
        this.state.invitedState[checkedIndex] = event.target.checked;

        if (event.target.checked) {
            this.invitedList.push(value);
        } else {
            let index = this.invitedList.indexOf(value);
            this.invitedList.splice(index, 1);
        }

        this.setState({
            checkAllInvited: this.state.checkAllInvited,
            invitedState: this.state.invitedState
        });
    }

    toggleCheckboxAdded(checkedIndex, event) {
        if (this.state.checkAllAdded) {
            this.state.checkAllAdded = !this.state.checkAllAdded;
        }

        let value = event.target.value;

        this.state.addedState[checkedIndex] = event.target.checked;

        if (event.target.checked) {
            this.addedList.push(value);
        } else {
            const index = this.addedList.indexOf(value);
            this.addedList.splice(index, 1);
        }

        this.setState({
            checkAllAdded: this.state.checkAllAdded,
            addedState: this.state.addedState
        });
    }

    selectAllInvited(event) {
        const invitedState = [];
        this.invitedList = [];

        if (event.target.checked) {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'invited') {
                    invitedState[index] = true;
                    this.invitedList.push(data.email);
                }
            });
        } else {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'invited') {
                    invitedState[index] = false;
                }
            });
        }

        this.setState({
            checkAllInvited: event.target.checked,
            invitedState: invitedState
        });
    }

    selectAllAdded(event) {
        let addedState = [];
        this.addedList = [];
        if (event.target.checked) {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'added') {
                    addedState[index] = true;
                    this.addedList.push(data.email);
                }
            });
        } else {
            this.state.inviteData.forEach((data, index) => {
                if (data.type === 'added') {
                    addedState[index] = false;
                }
            });
        }

        this.setState({
            checkAllAdded: event.target.checked,
            addedState: addedState
        });
    }

    inviteAddedMember() {
        const data = {invites: []};
        this.addedList.forEach((mail) => {
            data.invites.push({email: mail});
        });
        Client.inviteMembersToChannel(
            data,
            () => {
                //success
            },
            (err) => {
                //err
            }
        );
    }

    inviteSelected() {
        let emailList;
        const joinAllArray = [];
        const textEmail = $('#recently_invited_email').val();
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
            () => {
                //success
            },
            (err) => {
                //err
            }
        );
    }
    loadMoreMember() {
        // this.invitedList.slice(0, 5);
        this.setState({limitOfMember: 10});
    }

    componentWillReceiveProps(newProps) {
        if (!newProps.showInitialState) {
            $('#recently_invited, #recently_added,#get_link').removeClass('active');
            $('.pill-list').removeClass('active');
            this.setState({
                showAllUsers: true
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
        if (users.length === this.props.users.length) {
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

        return (
            <div
                className='filtered-user-list'
                style={this.props.style}
            >
                <div className='filter-row'>
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
                    <ul className='nav nav-pills'>
                        <li className='pill-list'>
                            <a data-toggle='pill'
                                href='#recently_added'
                                onClick={this.pillClicked.bind(this, 'added')}
                            >Recently Added</a></li>
                        <li className='pill-list'>
                            <a data-toggle='pill'
                                href='#recently_invited'
                                onClick={this.pillClicked.bind(this, 'invited')}
                            >Recently Invited</a>
                        </li>
                        <li className='pill-list'>
                            <a data-toggle='pill'
                                href='#get_link'
                                onClick={this.pillClicked.bind(this, 'link')}
                            >Get Link</a>
                        </li>
                    </ul>
                    {

                    }
                    <div className='tab-content'>
                        <div id='recently_added'
                            className='tab-pane fade in'
                        >
                            {this.recently_added_arr && this.recently_added_arr.length ?
                                <div>
                                    <input
                                        type='checkbox'
                                        checked={this.state.checkAllAdded}
                                        onChange={this.selectAllAdded.bind(this)}
                                        name='select_all'
                                        value='all_users'
                                    />
                                    <FormattedMessage
                                        id='filtered_user_list.selectAll'
                                        defaultMessage='Select All'
                                    />
                                    <button
                                        type='button'
                                        className='btn btn-primary btn-lg'
                                        onClick={this.inviteAddedMember.bind(this)}
                                    >Add</button>
                                    {
                                        this.recently_added_arr.map((obj, index) => {
                                            return (
                                                <div className='col-md-4 col-xs-4'
                                                    key={index}
                                                >
                                                    <input checked={this.state.addedState[index]}
                                                        type='checkbox'
                                                        name={obj.email}
                                                        value={obj.email}
                                                        onChange={this.toggleCheckboxAdded.bind(this, index)}
                                                    />
                                                    {obj.email}
                                                </div>
                                            );
                                        })
                                    }
                                    <a href=''
                                        onClick={this.loadMoreMember}
                                    >Load more..</a>
                                </div> : <p>No recently added users :(</p>
                            }
                        </div>
                        <div id='recently_invited'
                            className='tab-pane col fade'
                        >
                            <div className='col-md-12'>
                                <div className='col-md-9'>
                                    <textarea id='recently_invited_email'
                                        rows='4'
                                        cols='50'
                                        placeholder={formatMessage(holders.multipleEmail)}
                                    >
                                    </textarea>
                                </div>
                                <div className='col-md-3'>
                                    <button type='button'
                                        onClick={this.inviteSelected.bind(this)}
                                        className='btn btn-primary btn-lg'
                                    >
                                        <FormattedMessage
                                            id='filtered_user_list.send'
                                            defaultMessage='Send'
                                        />
                                    </button>
                                </div>
                            </div>
                            <br/>
                            <input checked={this.state.checkAllInvited}
                                onChange={this.selectAllInvited.bind(this)}
                                type='checkbox'
                                name='select_all'
                                value='all_users'
                            /> Select All

                            {this.recently_invited_arr && this.recently_invited_arr.length ?
                                <div>
                                    {
                                        this.recently_invited_arr.map((obj, index) => {
                                            return (
                                                <div className='col-md-4 col-xs-4'
                                                    key={index}
                                                >
                                                    <input checked={this.state.invitedState[index]}
                                                        type='checkbox'
                                                        name={obj.email}
                                                        value={obj.email}
                                                        onChange={this.toggleCheckboxInvited.bind(this, index)}
                                                    />
                                                    {obj.email}
                                                </div>
                                            );
                                        })
                                    }
                                    <a href=''
                                        onClick={this.loadMoreMember}
                                    >Load more..</a>
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
                                value={this.props.link}
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
    style: React.PropTypes.object
};

export default injectIntl(FilteredUserList);
