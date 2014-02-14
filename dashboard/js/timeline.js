PER_PAGE = 50;

var authorTemplate = Handlebars.compile($('#timeline-author-template').html());

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
        username: login,
        avatar: avatarURL,
        githubURL: githubURL
    };
}

function formatPayload (payload) {
  var data = {
    comment: '',
    count: '',
    commits: '',
    diffTree: ''
  };
  if (payload.comment) {
    data.comment = payload.comment.body;
    data.count = payload.issue.comments;
  }
  if (payload.commits) {
    data.diffTree = payload.before.substr(0,10) + '...' + payload.head.substr(0,10);
    data.commits = payload.commits.map(function(commit) {
      return {
        commitUrl: commit.url,
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
        },
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
        },
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
            return 'nobody';
        },
        number: function(e) {
          return e.payload.issue.number;
        },
        issue_age: function(e) {
          return moment().from(e.payload.issue.created_at, true);
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
            return 'nobody';
        },
        title: function(e) {
          return e.payload.issue.title;
        },
        number: function(e) {
          return e.payload.issue.number;
        },
        issue_age: function(e) {
          return moment().from(e.payload.issue.created_at, true);
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
            return "pull request " + makeLink(pullReqURL, '#' + number);
        },
        link: function(e) {
            return e.payload.comment.html_url;
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
    'EndOfTimeline': {
        action: function (e) {
            return "No more events available";
        },
        object: function (e) {
            return;
        }
    }
};

function populateTimeline(count, starting_from) {
    var $timeline = $('#timeline');
    var template = Handlebars.compile($('#timeline-item-template').html());
    var $loading = $('#timeline-loading');

    // if we don't have a specified index, don't do anythin
    if (API_BASE.indexOf('undefined/undefined') >= 0) {
        return;
    }

    if (!count) {
        count = PER_PAGE;
    }
    if (!starting_from) {
        starting_from = 0;
    }

    $.get(API_BASE + '/recent_events',
          {count: count, starting_from: starting_from})
          .success(function(data) {
              var fragment = document.createDocumentFragment();
              data.data.forEach(function(e) {
                  mapping = TIMELINE_MAPPING[e.type];
                  if (!mapping) {
                      return;
                  }
                  console.log(e);
                  context = {
                      avatar: formatAuthor(e.actor).avatar,
                      username: formatAuthor(e.actor).username,
                      comment: formatPayload(e.payload).comment,
                      number: mapping.number ? mapping.number(e) : 0,
                      issue_age: mapping.issue_age ? mapping.issue_age(e) : 0,
                      commentCount: formatPayload(e.payload).count,
                      commits: formatPayload(e.payload).commits,
                      diffTree: formatPayload(e.payload).diffTree,
                      url: e.repo.name,
                      assignee: mapping.assignee ? mapping.assignee(e) : '',
                      action: mapping.action(e),
                      object: mapping.object(e),
                      timestamp: moment(e.created_at).fromNow(),
                      title: mapping.title ? mapping.title(e) : ''
                  };
                  if (mapping.link) {
                      context.link = mapping.link(e);
                  }
                  var $item = $(template(context));
                  fragment.appendChild($item[0]);
              });
              $(fragment).insertBefore($loading);

              if (!data.data.length) {
                  mapping = TIMELINE_MAPPING['EndOfTimeline'];
                  context = {
                      author: "Sorry!",
                      action: mapping.action(),
                      object: mapping.object(),
                      timestamp: ""
                  };
                  var $item = $(template(context));
                  $loading.remove();
                  $timeline.append($item);
                  $('#tab-1').off('scroll');
              }
          });

    if (!starting_from) {
        $('#tab-1').on('scroll', function () {
            if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                populateTimeline(PER_PAGE, $timeline.children('.timeline-item').length);
            }
        });
    }
}
