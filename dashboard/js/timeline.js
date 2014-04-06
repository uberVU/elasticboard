(function(){

    'use strict';
    window.App = window.App || {};
    window.App.PER_PAGE = 40;

    var authorTemplate = Handlebars.compile($('#timeline-author-template').html());
    var collabs = null;

    Handlebars.registerHelper('eachCommit', function(context, options) {
        var ret = "";

        for(var i=0, j=context.length; i<j; i++) {
            ret = ret + options.fn(context[i]);
        }

        return ret;
    });

    function formatAuthor(author) {
        var login = author.login;
        var avatarURL = author.avatar_url;
        var githubURL = 'http://github.com/' + login;

        return {
            username: {
                username: login,
                    url: githubURL
            },
                avatar: avatarURL
        };
    }

    function formatPayload (payload) {
        var data = {
            comment: '',
            count: '',
            commits: '',
            diffTree: '',
            labels: []
        };
        if (payload.comment) {
            data.comment = payload.comment.body;
            // FIXME: @piatra
            if (payload.issue) {
                data.count = payload.issue.comments;
            } else {
                data.count = 0;
            }
        }
        if (payload.issue) {
            data.labels = payload.issue.labels;
        }
        if (payload.commits) {
            data.diffTree = payload.before.substr(0,10) + '...' + payload.head.substr(0,10);
            data.commits = payload.commits.map(function(commit) {
                return {
                    commitUrl: commit.url.replace('https://api.', 'https://').replace('/commits/', '/commit/').replace('/repos/', '/'),
                message: commit.message,
                sha: commit.sha.substr(0,10)
                };
            });
        }
        return data;
    }

    function formatLink(href, text, title) {
        if (title) {
            return '<a href="' + href + '" title="' + title + '">' + text + '</a>';
        }
        return '<a href="' + href + '">' + text + '</a>';
    }

    function formatIssue(issue) {
        return formatLink(issue.html_url, '#' + issue.number, issue.title);
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
            link: function(e) {
                return e.payload.comment.html_url;
            }
        },
        'CreateEvent': {
            action: function(e) {
                var s = "created";
                if (e.payload.ref_type == 'branch') {
                    return s + " branch";
                } else if (e.payload.ref_type == 'tag') {
                    return s + " tag";
                }
                return s;
            },
            object: function(e) {
                return e.payload.ref;
            }
        },
        'DeleteEvent': {
            action: function(e) {
                var s = "deleted";
                if (e.payload.ref_type == 'branch') {
                    return s + " branch";
                } else if (e.payload.ref_type == 'tag') {
                    return s + " tag";
                }
                return s;
            },
            object: function(e) {
                return e.payload.ref;
            }
        },
        'ForkEvent': {
            action: function(e) {
                return "forked to";
            },
            object: function(e) {
                var name = e.payload.forkee.full_name;
                var url = e.payload.forkee.html_url;
                return formatLink(url, name);
            }
        },
        'GollumEvent': {
            action: function(e) {
                var page = e.payload.pages[0];
                return page.action;
            },
            object: function(e) {
                var page = e.payload.pages[0];
                return "wiki page " + formatLink(page.html_url, page.page_name);
            }
        },
        'IssueCommentEvent': {
            title: function(e) {
                return e.payload.issue.title;
            },
            action: function(e) {
                return "commented on";
            },
            object: function(e) {
                return formatIssue(e.payload.issue);
            },
            link: function(e) {
                return e.payload.comment.html_url;
            },
            assignee: function(e) {
                var assignee = e.payload.issue.assignee;
                if (assignee) {
                    return assignee.login;
                }
                return 'no one';
            },
            number: function(e) {
                return e.payload.issue.number;
            },
            issue_age: function(e) {
                return moment().from(e.payload.issue.created_at, true);
            },
            issueURL: function(e) {
                if (e.payload && e.payload.comment) {
                    var url = e.payload.comment.html_url.split('#')[0];
                    return url;
                } else {
                    return '';
                }
            }
        },
        'IssuesEvent': {
            action: function(e) {
                return e.payload.action;
            },
            object: function(e) {
                return formatIssue(e.payload.issue);
            },
            assignee: function(e) {
                var assignee = e.payload.issue.assignee;
                if (assignee) {
                    return assignee.login;
                }
                return 'no one';
            },
            title: function(e) {
                return e.payload.issue.title;
            },
            number: function(e) {
                return e.payload.issue.number;
            },
            issue_age: function(e) {
                return moment().from(e.payload.issue.created_at, true);
            },
            issueURL: function(e) {
                if (e.payload && e.payload.comment) {
                    var url = e.payload.comment.html_url.split('#')[0];
                    return url;
                } else if (e.payload && e.payload.issue) {
                    return e.payload.issue.html_url;
                } else {
                    return '';
                }
            }
        },
        'MemberEvent': {
            action: function(e) {
                return "added";
            },
            object: function(e) {
                var user = e.payload.member;
                return formatLink(user.html_url, user.login) + " as a collaborator";
            }
        },
        'PublicEvent': {
            action: function(e) {
                return "open sourced";
            },
            object: function(e) {
                return "the repository";
            }
        },
        'PullRequestEvent': {
            action: function(e) {
                return e.payload.action;
            },
            object: function(e) {
                var pullReq = e.payload.pull_request;
                return "pull request " + formatIssue(pullReq);
            },
            title: function(e) {
                return e.payload.pull_request.title;
            },
            number: function(e) {
                return e.payload.pull_request.number;
            },
            issueURL: function(e) {
                return e.payload.pull_request.comments_url;
            },
            changes: function(e) {
                return {
                    additions: e.payload.pull_request.additions,
                    deletions: e.payload.pull_request.deletions
                };
            },
            issue_age: function(e) {
                return moment().from(e.payload.pull_request.created_at, true);
            }
        },
        'PullRequestReviewCommentEvent': {
            action: function(e) {
                return "reviewed";
            },
            object: function(e) {
                var url = e.payload.comment.pull_request_url;
                var number = url.substring(url.lastIndexOf('/') + 1);
                var htmlURL = e.payload.comment.html_url;
                var pullReqURL = htmlURL.substring(0, htmlURL.lastIndexOf('#'));
                return "pull request " + App.utils.makeLink(pullReqURL, '#' + number);
            },
            link: function(e) {
                return e.payload.comment.html_url;
            },
            title: function(e) {
                var url = e.payload.comment.html_url;
                var id = url.match(/\/[0-9]+#/g)[0];
                var repo = e.repo.name;
                id = id.substring(1,id.length-1);
                var title = 'Review for pull request '+ App.utils.makeLink(url, '#' + id) +'<br>';
                return title += App.utils.makeLink('https://github.com/' + repo + '/pull' + id + '/files', 'View changed files');
            }
        },
        'PushEvent': {
            action: function(e) {
                return "pushed";
            },
            object: function(e) {
                var count = e.payload.size;
                return count + " commits";
            },
            link: function(e) {
                var head = e.payload.head;
                var repo = e.repo.name;
                var url = 'http://github.com/' + repo + '/commit/' + head;
                return url;
            }
        },
        'WatchEvent': {
            action: function(e) {
                return "starred";
            },
            object: function(e) {
                return "the repository";
            }
        },
        'TeamAddEvent': {
            action: function(e) {
                return 'Team add event';
            },
            object: function(e) {
                return 'for ' + e.payload.team.name;
            }
        },
        'EndOfTimeline': {
            action: function (e) {
                return "No more events available";
            },
            object: function (e) {
                return "<p class='text-centered'>No more events available</p>";
            }
        }
    };

    function formatContext (e) {
        var mapping = TIMELINE_MAPPING[e.type];
        var context;

        if (!mapping) {
            if (!e.body) {
                // FIXME: need better handling for this
                // can't figure out what kind of event this is
                return;
            }
            context = {
                avatar: e.user.avatar_url,
                username: {
                    username: e.user.login,
                    url: e.user.html_url
                },
                comment: e.body,
                number: e.number,
                issue_age: moment().from(e.created_at, true),
                commentCount: e.comments,
                commits: [],
                diffTree: '',
                url: '',
                assignee: e.assignee || 'no one',
                action: 'commented: ',
                object: '',
                timestamp: moment(e.created_at).fromNow(),
                title: e.title
            };
        } else {
            context = {
                avatar: formatAuthor(e.actor).avatar,
                username: formatAuthor(e.actor).username,
                comment: formatPayload(e.payload).comment,
                number: mapping.number ? mapping.number(e) : 0,
                issue_age: mapping.issue_age ? mapping.issue_age(e) : 0,
                labels: formatPayload(e.payload).labels,
                commentCount: formatPayload(e.payload).count,
                commits: formatPayload(e.payload).commits,
                diffTree: formatPayload(e.payload).diffTree,
                url: e.repo.name,
                assignee: mapping.assignee ? mapping.assignee(e) : 'no one',
                action: mapping.action(e),
                object: mapping.object(e),
                timestamp: moment(e.created_at).fromNow(),
                title: mapping.title ? mapping.title(e) : ''
            };
        }

        // is the user a repo collab?
        context.collab = collabs.some(function (u) {
            return u.login === context.username.username;
        });

        if (context.number && context.title) {
            if (mapping && mapping.issueURL) {
                context.issueURL = mapping.issueURL(e);
            } else {
                context.issueURL = e.html_url;
            }
        }
        if (mapping && mapping.changes) {
            // changes refer to additions & deletions in a pull request
            context.changes = mapping.changes(e);
        }
        return context;
    }

    function processTimelineData(data) {
        var $timeline = $('#timeline');
        var template = Handlebars.compile($('#timeline-item-template').html());
        var templateBasic = Handlebars.compile($('#timeline-item-basic').html());
        var $loading = $('#timeline-loading');

        var fragment = document.createDocumentFragment();
        var mapping;
        data.data.forEach(function(e) {
            mapping = TIMELINE_MAPPING[e.type];
            var context = formatContext(e);

            if (!context) return;

            if (mapping && mapping.link) {
                context.link = mapping.link(e);
            }

            var $item;

            if (e.type == 'CommitCommentEvent' || context.action == 'starred' || context.action == 'forked to') {
                context.img = context.action == 'starred' ? 'starred' : 'forked';

                if (e.type == 'CommitCommentEvent') context.img = 'comment';

                $item = $(templateBasic(context));

            } else {

                $item = $(template(context));

            }

            fragment.appendChild($item[0]);
        });

        $(fragment).insertBefore($loading);

        if (!data.data.length) {
            mapping = TIMELINE_MAPPING.EndOfTimeline;
            $(document).off('scroll');
            var context = {
                author: "Sorry!",
                action: '',
                object: mapping.object(),
                timestamp: ""
            };

            var $item = $(template(context));
            $loading.remove();
            $timeline.append($item);
            $('#tab-1').off('scroll');
        }

    }

    window.populateTimeline = function populateTimeline(count, starting_from) {
        $('li[data-tab=tab-timeline]').addClass('selected');

        if (!count) {
            count = App.PER_PAGE || 50;
        }
        if (!starting_from) {
            starting_from = 0;
        }

        App.utils.httpGet(App.BASE + '/collaborators', function(data) {
            collabs = data.data;
            $.get(App.BASE + '/recent_events', {count: count, starting_from: starting_from})
                .success(processTimelineData)
                .fail(displayFailMessage);
        });
    };

    window.emptyTimeline = function() {
        var $timeline = $('#timeline');
        var $loading = $('.timeline-item:last-child', $timeline).clone();
        $timeline.empty().append($loading);
    };

})();
