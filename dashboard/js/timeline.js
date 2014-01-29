var authorTemplate = Handlebars.compile($('#timeline-author-template').html());
function formatAuthor(author) {
    var login = author.login;
    var avatarURL = author.avatar_url;
    var githubURL = 'http://github.com/' + login;

    return authorTemplate({
        login: login,
        avatarURL: avatarURL,
        githubURL: githubURL
    });
}

function formatLink(href, text) {
    return '<a href="' + href + '">' + text + '</a>';
}

function formatIssue(event) {
    var issue = event.payload.issue;
    return formatLink(issue.html_url, '#' + issue.number);
}


var TIMELINE_MAPPING = {
    'IssueCommentEvent': {
        action: function(e) {
            return 'commented on';
        },
        object: formatIssue
    }
};

