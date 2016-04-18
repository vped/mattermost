// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import UserStore from '../stores/user_store.jsx';
import * as Utils from '../utils/utils.jsx';
import TimeSince from './time_since.jsx';
import * as EventHelpers from '../dispatcher/event_helpers.jsx';
import * as Client from '../utils/client.jsx';
import Constants from '../utils/constants.jsx';

import {FormattedMessage} from 'mm-intl';

export default class PostInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            liked: false
        };

        this.dropdownPosition = this.dropdownPosition.bind(this);
        this.handlePermalink = this.handlePermalink.bind(this);
        this.removePost = this.removePost.bind(this);
        this.addLike = this.addLike.bind(this);
    }

    componentDidMount() {
        $('.post__icon', ReactDOM.findDOMNode(this)).tooltip({trigger: 'hover'});
        $('.comment-icon__container', ReactDOM.findDOMNode(this)).tooltip();
    }
    
    componentWillUnmount(){
        $('.post__icon', ReactDOM.findDOMNode(this)).tooltip('destroy');
        $('.comment-icon__container', ReactDOM.findDOMNode(this)).tooltip('destroy');
    }

    addLike() {
        let data = this.props.post;

        if (this.state.liked) {
            this.setState({
                liked: false
            }, () => {
                data.liked = 'unliked';
                Client.updatePost(
                    this.props.post,
                    (success) => {
                        console.log("successs", success);
                    },
                    (err) => {
                        console.log("errr11111rrrr",err);
                    }
                );
            });
        }else{
            this.setState({
                liked : true
            }, function(success) {
                 data.liked = "liked";
                Client.updatePost(
                    this.props.post,
                    (success) => {
                        console.log("successs", success);
                    },
                    (err) => {
                        console.log("errr11111rrrr",err);
                    }
                );
            });
        }
    }

    dropdownPosition(e) {
        var position = $('#post-list').height() - $(e.target).offset().top;
        var dropdown = $(e.target).next('.dropdown-menu');
        if (position < dropdown.height()) {
            dropdown.addClass('bottom');
        }
    }
    createDropdown() {
        var post = this.props.post;
        var isOwner = UserStore.getCurrentId() === post.user_id;
        var isAdmin = Utils.isAdmin(UserStore.getCurrentUser().roles);

        if (post.state === Constants.POST_FAILED || post.state === Constants.POST_LOADING || Utils.isPostEphemeral(post)) {
            return '';
        }

        var type = 'Post';
        if (post.root_id && post.root_id.length > 0) {
            type = 'Comment';
        }

        var dropdownContents = [];
        var dataComments = 0;
        if (type === 'Post') {
            dataComments = this.props.commentCount;
        }

        if (this.props.allowReply === 'true') {
            dropdownContents.push(
                 <li
                     key='replyLink'
                     role='presentation'
                 >
                     <a
                         className='link__reply theme'
                         href='#'
                         onClick={this.props.handleCommentClick}
                     >
                         <FormattedMessage
                             id='post_info.reply'
                             defaultMessage='Reply'
                         />
                     </a>
                 </li>
             );
        }

        if (!Utils.isMobile()) {
            dropdownContents.push(
                <li
                    key='copyLink'
                    role='presentation'
                >
                    <a
                        href='#'
                        onClick={this.handlePermalink}
                    >
                        <FormattedMessage
                            id='post_info.permalink'
                            defaultMessage='Permalink'
                        />
                    </a>
                </li>
            );
        }

        if (isOwner || isAdmin) {
            dropdownContents.push(
                <li
                    key='deletePost'
                    role='presentation'
                >
                    <a
                        href='#'
                        role='menuitem'
                        onClick={() => EventHelpers.showDeletePostModal(post, dataComments)}
                    >
                        <FormattedMessage
                            id='post_info.del'
                            defaultMessage='Delete'
                        />
                    </a>
                </li>
            );
        }

        if (isOwner) {
            dropdownContents.push(
                <li
                    key='editPost'
                    role='presentation'
                >
                    <a
                        href='#'
                        role='menuitem'
                        data-toggle='modal'
                        data-target='#edit_post'
                        data-refocusid='#post_textbox'
                        data-title={type}
                        data-message={post.message}
                        data-postid={post.id}
                        data-channelid={post.channel_id}
                        data-comments={dataComments}
                    >
                        <FormattedMessage
                            id='post_info.edit'
                            defaultMessage='Edit'
                        />
                    </a>
                </li>
            );
        }

        if (dropdownContents.length === 0) {
            return '';
        }

        return (
            <div>
                <a
                    href='#'
                    className={(this.state.liked ? 'post__like__icon post__icon' : 'post__unlike__icon post__icon') +" fa fa-heart"}
                    type='button'
                    title={this.state.liked ? 'Unlike' : 'Like'}
                    onClick={this.addLike}
                />
                <a
                    href='#'
                    className='dropdown-toggle post__dropdown theme'
                    type='button'
                    data-toggle='dropdown'
                    aria-expanded='false'
                    onClick={this.dropdownPosition}
                />
                <ul
                    className='dropdown-menu'
                    role='menu'
                >
                    {dropdownContents}
                </ul>
            </div>
        );
    }

    handlePermalink(e) {
        e.preventDefault();
        EventHelpers.showGetPostLinkModal(this.props.post);
    }

    removePost() {
        EventHelpers.emitRemovePost(this.props.post);
    }
    createRemovePostButton(post) {
        if (!Utils.isPostEphemeral(post)) {
            return null;
        }

        return (
            <a
                href='#'
                className='post__remove theme'
                type='button'
                onClick={this.removePost}
            >
                {'×'}
            </a>
        );
    }
    render() {
        var post = this.props.post;
        var comments = '';
        var showCommentClass = '';
        var commentCountText = this.props.commentCount;

        if (this.props.commentCount >= 1) {
            showCommentClass = ' icon--show';
        } else {
            commentCountText = '';
        }

        if (post.state !== Constants.POST_FAILED && post.state !== Constants.POST_LOADING && !Utils.isPostEphemeral(post)) {
            comments = (
                <a
                    href='#'
                    className={'comment-icon__container' + showCommentClass}
                    onClick={this.props.handleCommentClick}
                    title="Reply"
                >
                    <span
                        className='comment-icon'
                        dangerouslySetInnerHTML={{__html: Constants.REPLY_ICON}}
                    />
                    {commentCountText}
                </a>
            );
        }

        var dropdown = this.createDropdown();

        return (
            <ul className='post__header post__header--info'>
                <li className='col'>
                    <TimeSince
                        eventTime={post.create_at}
                        sameUser={this.props.sameUser}
                    />
                </li>
                <li className='col col__reply'>
                    <div
                        className='dropdown'
                        ref='dotMenu'
                    >
                        {dropdown}
                    </div>
                    {comments}
                    {this.createRemovePostButton(post)}
                </li>
            </ul>
        );
    }
}

PostInfo.defaultProps = {
    post: null,
    commentCount: 0,
    isLastComment: false,
    allowReply: false,
    sameUser: false
};
PostInfo.propTypes = {
    post: React.PropTypes.object,
    commentCount: React.PropTypes.number,
    isLastComment: React.PropTypes.bool,
    allowReply: React.PropTypes.string,
    handleCommentClick: React.PropTypes.func,
    sameUser: React.PropTypes.bool
};
