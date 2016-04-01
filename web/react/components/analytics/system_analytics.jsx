// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import LineChart from './line_chart.jsx';
import DoughnutChart from './doughnut_chart.jsx';
import StatisticCount from './statistic_count.jsx';
import TableChart from './table_chart.jsx';
import AnalyticsStore from '../../stores/analytics_store.jsx';

import * as Utils from '../../utils/utils.jsx';
import * as AsyncClient from '../../utils/async_client.jsx';
import Constants from '../../utils/constants.jsx';
const StatTypes = Constants.StatTypes;

import {injectIntl, intlShape, defineMessages, FormattedMessage} from 'mm-intl';

const holders = defineMessages({
    analyticsPublicChannels: {
        id: 'analytics.system.publicChannels',
        defaultMessage: 'Public Channels'
    },
    analyticsPrivateGroups: {
        id: 'analytics.system.privateGroups',
        defaultMessage: 'Private Groups'
    },
    analyticsFilePosts: {
        id: 'analytics.system.totalFilePosts',
        defaultMessage: 'Posts with Files'
    },
    analyticsHashtagPosts: {
        id: 'analytics.system.totalHashtagPosts',
        defaultMessage: 'Posts with Hashtags'
    },
    analyticsTextPosts: {
        id: 'analytics.system.textPosts',
        defaultMessage: 'Posts with Text-only'
    }
});

class SystemAnalytics extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);

        this.state = {stats: AnalyticsStore.getAllSystem()};
    }

    componentDidMount() {
        AnalyticsStore.addChangeListener(this.onChange);

        AsyncClient.getStandardAnalytics();
        AsyncClient.getPostsPerDayAnalytics();
        AsyncClient.getUsersPerDayAnalytics();
        AsyncClient.getTotalUsersByEmailDomainAnalytics();
        AsyncClient.getTotalChannelsByEmailDomainAnalytics();
        AsyncClient.getTotalUsersPerChannelAnalytics();
        AsyncClient.getTotalPostsPerChannelAnalytics();
        AsyncClient.getTotalFilesPerChannelAnalytics();

        if (global.window.mm_license.IsLicensed === 'true') {
            AsyncClient.getAdvancedAnalytics();
        }
    }

    componentWillUnmount() {
        AnalyticsStore.removeChangeListener(this.onChange);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!Utils.areObjectsEqual(nextState.stats, this.state.stats)) {
            return true;
        }

        return false;
    }

    onChange() {
        this.setState({stats: AnalyticsStore.getAllSystem()});
    }

    render() {
        const stats = this.state.stats;

        let advancedCounts;
        let advancedGraphs;
        if (global.window.mm_license.IsLicensed === 'true') {
            advancedCounts = (
                <div className='row'>
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalSessions'
                                defaultMessage='Total Sessions'
                            />
                        }
                        icon='fa-signal'
                        count={stats[StatTypes.TOTAL_SESSIONS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalCommands'
                                defaultMessage='Total Commands'
                            />
                        }
                        icon='fa-terminal'
                        count={stats[StatTypes.TOTAL_COMMANDS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalIncomingWebhooks'
                                defaultMessage='Incoming Webhooks'
                            />
                        }
                        icon='fa-arrow-down'
                        count={stats[StatTypes.TOTAL_IHOOKS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalOutgoingWebhooks'
                                defaultMessage='Outgoing Webhooks'
                            />
                        }
                        icon='fa-arrow-up'
                        count={stats[StatTypes.TOTAL_OHOOKS]}
                    />
                </div>
            );

            const channelTypeData = formatChannelDoughtnutData(stats[StatTypes.TOTAL_PUBLIC_CHANNELS], stats[StatTypes.TOTAL_PRIVATE_GROUPS], this.props.intl);
            const postTypeData = formatPostDoughtnutData(stats[StatTypes.TOTAL_FILE_POSTS], stats[StatTypes.TOTAL_HASHTAG_POSTS], stats[StatTypes.TOTAL_POSTS], this.props.intl);

            advancedGraphs = (
                <div className='row'>
                    <DoughnutChart
                        title={
                            <FormattedMessage
                                id='analytics.system.channelTypes'
                                defaultMessage='Channel Types'
                            />
                        }
                        data={channelTypeData}
                        width='300'
                        height='225'
                    />
                    <DoughnutChart
                        title={
                            <FormattedMessage
                                id='analytics.system.postTypes'
                                defaultMessage='Posts, Files and Hashtags'
                            />
                        }
                        data={postTypeData}
                        width='300'
                        height='225'
                    />
                </div>
            );
        }

        const postCountsDay = formatPostsPerDayData(stats[StatTypes.POST_PER_DAY]);
        const userCountsWithPostsDay = formatUsersWithPostsPerDayData(stats[StatTypes.USERS_WITH_POSTS_PER_DAY]);
        const totalUsersByEmailDomain = formatNameValue(stats[StatTypes.TOTAL_USERS_BY_EMAIL_DOMAIN]);
        const totalChannelsByEmailDomain = formatNameValue(stats[StatTypes.TOTAL_CHANNELS_BY_EMAIL_DOMAIN]);
        const totalUsersPerChannel = formatNameValue(stats[StatTypes.TOTAL_USERS_PER_CHANNEL]);
        const totalPostsPerChannel = formatNameValue(stats[StatTypes.TOTAL_POSTS_PER_CHANNEL]);
        const totalFilesPerChannel = formatNameValue(stats[StatTypes.TOTAL_FILES_PER_CHANNEL]);

        return (
            <div className='wrapper--fixed team_statistics'>
                <h3>
                    <FormattedMessage
                        id='analytics.system.title'
                        defaultMessage='System Statistics'
                    />
                </h3>
                <div className='row'>
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalUsers'
                                defaultMessage='Total Users'
                            />
                        }
                        icon='fa-user'
                        count={stats[StatTypes.TOTAL_USERS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalTeams'
                                defaultMessage='Total Teams'
                            />
                        }
                        icon='fa-users'
                        count={stats[StatTypes.TOTAL_TEAMS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalPosts'
                                defaultMessage='Total Posts'
                            />
                        }
                        icon='fa-comment'
                        count={stats[StatTypes.TOTAL_POSTS]}
                    />
                    <StatisticCount
                        title={
                            <FormattedMessage
                                id='analytics.system.totalChannels'
                                defaultMessage='Total Channels'
                            />
                        }
                        icon='fa-globe'
                        count={stats[StatTypes.TOTAL_PUBLIC_CHANNELS] + stats[StatTypes.TOTAL_PRIVATE_GROUPS]}
                    />
                </div>
                {advancedCounts}
                {advancedGraphs}
                <div className='row'>
                    <LineChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalPosts'
                                defaultMessage='Total Posts'
                            />
                        }
                        data={postCountsDay}
                        width='740'
                        height='225'
                    />
                </div>
                <div className='row'>
                    <LineChart
                        title={
                            <FormattedMessage
                                id='analytics.system.activeUsers'
                                defaultMessage='Active Users With Posts'
                            />
                        }
                        data={userCountsWithPostsDay}
                        width='740'
                        height='225'
                    />
                </div>
                <div className='row'>
                    <TableChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalUsersByEmailDomain'
                                defaultMessage='Total number of users by email domain'
                            />
                        }
                        data={totalUsersByEmailDomain}
                    />
                    <TableChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalChannelsByEmailDomain'
                                defaultMessage='Total number of channels by email domain'
                            />
                        }
                        data={totalChannelsByEmailDomain}
                    />
                </div>
                <div className='row'>
                    <TableChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalUsersPerChannel'
                                defaultMessage='Total number of users per channel'
                            />
                        }
                        data={totalUsersPerChannel}
                    />
                    <TableChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalPostsPerChannel'
                                defaultMessage='Total number of posts per channel'
                            />
                        }
                        data={totalPostsPerChannel}
                    />
                </div>
                <div className='row'>
                    <TableChart
                        title={
                            <FormattedMessage
                                id='analytics.system.totalFilesPerChannel'
                                defaultMessage='Total number of files per channel'
                            />
                        }
                        data={totalFilesPerChannel}
                    />
                </div>
            </div>
        );
    }
}

SystemAnalytics.propTypes = {
    intl: intlShape.isRequired,
    team: React.PropTypes.object
};

export default injectIntl(SystemAnalytics);

export function formatChannelDoughtnutData(totalPublic, totalPrivate, intl) {
    const {formatMessage} = intl;
    const channelTypeData = [
        {
            value: totalPublic,
            color: '#46BFBD',
            highlight: '#5AD3D1',
            label: formatMessage(holders.analyticsPublicChannels)
        },
        {
            value: totalPrivate,
            color: '#FDB45C',
            highlight: '#FFC870',
            label: formatMessage(holders.analyticsPrivateGroups)
        }
    ];

    return channelTypeData;
}

export function formatPostDoughtnutData(filePosts, hashtagPosts, totalPosts, intl) {
    const {formatMessage} = intl;
    const postTypeData = [
        {
            value: filePosts,
            color: '#46BFBD',
            highlight: '#5AD3D1',
            label: formatMessage(holders.analyticsFilePosts)
        },
        {
            value: hashtagPosts,
            color: '#F7464A',
            highlight: '#FF5A5E',
            label: formatMessage(holders.analyticsHashtagPosts)
        },
        {
            value: totalPosts - filePosts - hashtagPosts,
            color: '#FDB45C',
            highlight: '#FFC870',
            label: formatMessage(holders.analyticsTextPosts)
        }
    ];

    return postTypeData;
}

export function formatPostsPerDayData(data) {
    var chartData = {
        labels: [],
        datasets: [{
            fillColor: 'rgba(151,187,205,0.2)',
            strokeColor: 'rgba(151,187,205,1)',
            pointColor: 'rgba(151,187,205,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(151,187,205,1)',
            data: []
        }]
    };

    for (var index in data) {
        if (data[index]) {
            var row = data[index];
            chartData.labels.push(row.name);
            chartData.datasets[0].data.push(row.value);
        }
    }

    return chartData;
}

export function formatUsersWithPostsPerDayData(data) {
    var chartData = {
        labels: [],
        datasets: [{
            fillColor: 'rgba(151,187,205,0.2)',
            strokeColor: 'rgba(151,187,205,1)',
            pointColor: 'rgba(151,187,205,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(151,187,205,1)',
            data: []
        }]
    };

    for (var index in data) {
        if (data[index]) {
            var row = data[index];
            chartData.labels.push(row.name);
            chartData.datasets[0].data.push(row.value);
        }
    }

    return chartData;
}

export function formatNameValue(data) {
    if (data == null) {
        return [];
    }
    const formattedData = data.map((row) => {
        const item = {};
        item.name = row.name.replace(/^\@/, '');
        item.value = row.value;
        item.tip = item.name + ': ' + item.value;
        return item;
    });
    return formattedData;
}
