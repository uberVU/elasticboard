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

function formatComment(event) {
    return formatLink(event.payload.comment.html_url, 'link');
}


var TIMELINE_MAPPING = {
    'CommitCommentEvent': {
        action: function(e) {
            return "commented on";
        },
        object: function(e) {
            var url = e.payload.comment.html_url;
            url = url.substring(0, url.lastIndexOf('#'));

            var sha = url.substring(url.lastIndexOf('/') + 1);
            return formatLink(url, sha.substring(0, 7));
        },
        link: formatComment
    },
    'CreateEvent': {
        action: function(e) {
            var s = "created ";
            if (e.payload.ref_type == 'branch') {
                return s + "branch";
            } else if (e.payload.ref_type == 'tag') {
                return s + "tag";
            }
            return s;
        },
        object: function(e) {
            return e.payload.ref;
        },
    },
    'IssueCommentEvent': {
        action: function(e) {
            return "commented on";
        },
        object: formatIssue,
        link: formatComment
    }
};

