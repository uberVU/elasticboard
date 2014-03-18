(function(){

    'use strict';

    window.App = window.App || {};
    App.BASE = App.HOST = (function() {
        var origin = location.origin;
        // remove the trailer port number if running on local
        if (origin.match(/[0-9]{4,4}/)) {
            origin = origin.split(':');
            origin.pop();
            origin = origin.join(':') + ':5000';
        }
        return origin;
    })();
    App.DEBUG = true;

    // get wrapper, logs and calls the callback or fail fn
    App.utils.httpGet = function httpGet(url, success, fail, always) {
        if (App.DEBUG) {
            console.log('[GET] ' + url);
        }
        return $.get(url).done(success).fail(fail || logFailure);
    };

    App.Router = Backbone.Router.extend({
        routes: {
            ':user/:repo/timeline': 'timeline',
            ':user/:repo/graphs'  : 'graphs',
            ':user/:repo/insights': 'insights',
            '*index'              : 'index'
        }
    });

    App.Views = {};
    App.Views.Topbar = Backbone.View.extend({
        el: $('#topbar .menu'),
        events: {
            'click li': 'changeView'
        },

        changeView: function(item) {
            var $el = $(item.target);
            var action = $el.text().toLowerCase();
            location.hash = '/' + App.REPO + '/' + action;
        }
    });

    App.Views.RepoSelector = Backbone.View.extend({
        el: $('#repo-select-trigger'),
        initialize: function() {
            getAllRepos(addRepos);
        },
        events: {
            'click'   : 'toggle',
            'click li': 'switchRepo'
        },
        toggle: function() {
            var $container = $('.repo-select');
            var $repoList = $('ul', $container);

            $container.toggleClass('hidden');
            $repoList.addClass('show--fade-in');

            if ($container.hasClass('hidden')) {
                $('.show--fade-in').removeClass('show--fade-in');
            }
        },
        switchRepo: function(event) {
            // remove all the events in the timeline
            // leave in only the loading spinner
            var repo = $(event.target).text();
            var $timeline = $('#timeline');
            var $loading = $('.timeline-item:last-child', $timeline).clone();
            $timeline.empty().append($loading);
            location.hash = '/' + repo + '/timeline';
        }
    });

    App.Views.PullIssueBadge = Backbone.View.extend({
        el: $('#pull-issue-badges'),
        initialize: function() {
            populateOpenIssues();
            populateOpenPulls();
        }
    });

    var topbar = new App.Views.Topbar();
    var repoSelecttor = new App.Views.RepoSelector();
    var pullIssueBadge;
    var appRouter = new App.Router();

    appRouter.on('route:index', function() {
        getRandomRepo(function(repo) {
            location.hash = '/' + repo + '/timeline';
        });
    });

    function initIssuePullBadges() {
        if (!pullIssueBadge)
            pullIssueBadge = new App.Views.PullIssueBadge();
    }

    appRouter.on('route:insights', function(user, repo){
        if (App.DEBUG) {
            console.log('[INSIGHTS]');
        }
        if (arguments.length > 3) {
            console.error('Bad request. Format is timeline/<user>/<repo>');
            if (App.DEBUG) {
                console.log(arguments);
            }
            return;
        }
        checkForRepo(user, repo, function(res) {
            if (res) {

                App.REPO = user + '/' + repo;
                App.BASE = App.HOST + '/' + App.REPO;

                $('#user-repo').text(App.REPO);

                drawInsights();
                $('.tab').hide();
                $('#tab-3').show();

                stopScrollListener();
                initIssuePullBadges();

            }
        });
    });

    appRouter.on('route:graphs', function(user, repo) {
        if (App.DEBUG) {
            console.log('[GRAPHS]');
        }
        if (arguments.length > 3) {
            console.error('Bad request. Format is timeline/<user>/<repo>');
            if (App.DEBUG) {
                console.log(arguments);
            }
            return;
        }
        checkForRepo(user, repo, function(res) {
            if (res) {

                App.REPO = user + '/' + repo;
                App.BASE = App.HOST + '/' + App.REPO;

                $('#user-repo').text(App.REPO);

                drawGraphs();
                $('.tab').hide();
                $('#tab-2').show();

                stopScrollListener();
                initIssuePullBadges();

            }
        });
    });

    appRouter.on('route:timeline', function(user, repo) {
        if (arguments.length > 3) {
            console.error('Bad request. Format is timeline/<user>/<repo>');
            if (App.DEBUG) {
                console.log(arguments);
            }
            return;
        }

        checkForRepo(user, repo, function(res) {
            if (res) {
                if (App.DEBUG) {
                    console.log('[TIMELINE] ' + user + ' ' + repo);
                }
                $('.tab').hide();
                $('#tab-1').show();

                fitTabContainer();
                window.onresize = fitTabContainer;
                App.REPO = user + '/' + repo;
                App.BASE = App.HOST + '/' + App.REPO;

                $('#user-repo').text(App.REPO);

                initTimeline();
                initIssuePullBadges();
            } else {
                console.error('No such repo');
            }
        });
    });

    function checkForRepo(user, repo, fn) {
        var url = App.HOST + '/available_repos';
        var s = user + '/' + repo;
        App.utils.httpGet(url, function(data) {
            var r = data.data.some(function(repo) {
                return repo.match(s);
            });
            fn(r);
        });
    }

    // FIXME?
    function fitTabContainer () {
        var $container = $('#tab-container');
        $container.height($(window).height() - $container.offset().top - 20);
    }

    function getAllRepos(cb) {
        var url = App.HOST + '/available_repos';
        App.utils.httpGet(url, cb);
    }

    // make a request for all available repos
    // call the callback with a random repo
    function getRandomRepo(fn) {
        getAllRepos(function(data) {
            var idx = parseInt(Math.random() * 100 % (data.data.length - 1), 10);
            var randomRepo = data.data[idx];
            fn(randomRepo);
        });
    }


    // generic fail method for logging
    function logFailure(data) {
        if (App.DEBUG) {
            console.log('Request failed.');
            console.log(data);
        }
    }

    // populate repo tooltip with all available repos
    function addRepos (data) {
        var $container = $('.repo-select');

        var $repoList = $('ul', $container);
        data.data.forEach(function (repo) {
            // TODO add actual links
            var repoLink = $('<a/>').text(repo);
            var repoLI = $('<li/>').append(repoLink);
            $repoList.append(repoLI);
        });
    }

    function initTimeline() {
        populateTimeline();
        addScrollListener();
    }

    function addScrollListener() {
        var $timeline = $('#timeline');
        $(document).on('scroll', function () {
            if (App.DEBUG) {
                console.log('[TIMELINE] scroll listener');
            }
            if($(window).scrollTop() + $(window).height() >= $(document).height() - 10) {
                populateTimeline(App.PER_PAGE, $timeline.children('.timeline-item').length);
            }
        });
    }

    function stopScrollListener() {
        $(document).off('scroll');
    }

    function populateOpenIssues() {
        App.utils.httpGet(App.BASE + "/issues_count", function (data) {
            var count = data.data.open;
            var $el = $('#open-issues-count');
            var url = 'http://github.com/' + App.REPO + '/issues?state=open';

            $el.text(count).attr('href', url);
        });
    }

    function populateOpenPulls() {
        App.utils.httpGet(App.BASE + "/pulls_count", function (data) {
            var count = data.data.open;
            var $el = $('#open-pulls-count');
            var url = 'http://github.com/' + App.REPO + '/pulls?state=open';

            $el.text(count).attr('href', url);
        });
    }


    Backbone.history.start();

})();

function logFailure(msg) {
    console.log('[FAILURE]', msg.statusText);
}

function displayFailMessage(fail) {

    var $tabContainer = $('#tab-container');

    if (fail.status != 404) {
        logFailure(fail);
        return;
    }

    $('#counts-container').remove();
    $tabContainer.empty();

    var msg = "<p class=\"text-center\">No data for this repository yet. Retrying in 2 minutes.</p>";
    $tabContainer.append(msg);

    setTimeout(function() {
        location.reload();
    }, 1000 * 60 * 2);
}
