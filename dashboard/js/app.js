var hash = location.hash.split('/'),
    API_HOST = 'http://' + window.location.hostname + ':5000/',
    API_BASE = API_HOST,
    REPO;

if (hash.length > 1) {
    REPO = hash[1] + '/' + hash[2];
    API_BASE += hash[1] + '/' + hash[2];
    initDashboard();
} else {
    getDefaultRepo();
}

/*
 * Bundle together different functions
 * used to load the widgets in the application
 */
function initDashboard () {
    populateOpenIssues();
    populateOpenPulls();
    populateTimeline();
    $('#user-repo').html(function(index, html) {
      return REPO + html;
    });
    changeTabs();
}

/*
 * According to URL path
 * navigate to different tabs in the application
 */
function changeTabs() {
    var parts = location.hash.split('/');
    if (parts.length > 3) {
        var tab = parts.pop();
        var tabs = $('ul.menu li');
        tabs.each(function (idx, el) {
            var text = $(el).text().toLowerCase();
            if (text == tab) {
                $(el).trigger('click');
            }
        });
    }
}

function fitTabContainer () {
    var $container = $('#tab-container');
    $container.height($(window).height() - $container.offset().top - 20);
}

window.onresize = fitTabContainer;
fitTabContainer();

$('#repo-select-trigger').on('click', function (e) {
    e.stopPropagation();

    var $container = $('.repo-select');
    var $repoList = $('ul', $container);

    $container.toggleClass('hidden');

    if (!$container.hasClass('hidden')) {
        getAvailableRepos(addRepos);
        $(window).on('click', function () {
            $('.show--fade-in').removeClass('show--fade-in');
            setTimeout(function () {
                $repoList.empty();
            }, 200);
            $(window).off('click');
            $container.toggleClass('hidden');
        })
    } else {
        $('.show--fade-in').removeClass('show--fade-in');
        setTimeout(function () {
            $repoList.empty();
        }, 200);
    }
});

function getAvailableRepos (cb) {
    $.get(API_HOST + 'available_repos')
        .success(function (data) {
            if (data.data.length == 0) {
                $('#counts-container').remove();
                $('#tab-container').empty();

                var msg = "<p class=\"text-center\">No data available. Please follow the " +
                    "<a href=\"https://github.com/uberVU/elasticboard/blob/master/README.md\">README</a>.</p>";
                $tabContainer = $('#tab-container');
                $tabContainer.append(msg);

                return;
            }
            cb(data);
        })
    .fail(function (data) {
        console.log('An error has occured');
    });
}

function addRepos (data) {
    var $container = $('.repo-select');

    var $repoList = $('ul', $container);
    data.data.forEach(function (repo) {
        var repoLink = document.createElement('a');
        var repoLI = document.createElement('li');
        repoLink.href = location.origin + location.pathname + '#/' + repo;
        repoLink.textContent = repo;
        repoLink.target = '_blank';
        repoLI.appendChild(repoLink);
        repoLI = $(repoLI);
        repoLI.on('click', function (e) {
            e.preventDefault();
            loadDashboard(repoLink.href);
        });
        $repoList.append(repoLI);
    });

    $repoList.toggleClass('show--fade-in');
}

function getDefaultRepo() {
    getAvailableRepos(function (data) {
        setLocation(location.origin + location.pathname + '#/' + data.data[0]); // load first repo
        hash = data.data[0].split('/');
        REPO = hash[0] + '/' + hash[1];
        API_BASE += hash[0] + '/' + hash[1];
        initDashboard();
    });
}

function setLocation (newlocation) {
    location.href = newlocation;
}

function loadDashboard (newlocation) {
    setLocation(newlocation);
    location.reload();
}

function populateOpenIssues() {
    $.get(API_BASE + "/issues_count").success(function (data) {
        var count = data.data.open;
        $('#open-issues-count').text(count);

        if (!count) {
            return;
        }

        var $p = $('#open-issues');
        $p.click(function () {
            var url = 'http://github.com/' + REPO + '/issues?state=open';
            window.location.href = url;
        });
        $p.addClass('clickable');
    });
}

function populateOpenPulls() {
    $.get(API_BASE + "/pulls_count").success(function (data) {
        var count = data.data.open;
        $('#open-pulls-count').text(count);

        if (!count) {
            return;
        }

        var $p = $('#open-pulls');
        $p.click(function () {
            var url = 'http://github.com/' + REPO + '/pulls?state=open';
            window.location.href = url;
        });
        $p.addClass('clickable');
    });
}

function logFailure(fail) {
    console.log("Trouble getting data. API server down?");
    console.log(fail);
}

function displayFailMessage(fail) {
    if (fail.status != 404) {
        logFailure(fail);
        return;
    }

    $('#counts-container').remove();
    $('#tab-container').empty();

    var msg = "<p class=\"text-center\">No data for this repository yet. Retrying in 2 minutes.</p>";
    $tabContainer = $('#tab-container');
    $tabContainer.append(msg);

    setTimeout(function() {
        location.reload();
    }, 1000 * 60 * 2);
}
