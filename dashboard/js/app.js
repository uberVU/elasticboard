var API_BASE = 'http://' + window.location.hostname + ':5000/';

function logFailure(fail) {
    console.log("Trouble getting data. API server down?");
    console.log(fail);
}

function makeLink(url, text) {
    var link = $('<a />', {
        href: url,
        text: text,
    });
    return $('<div />').append(link).html();
}

function makeList(container, options) {
    $.getJSON(API_BASE + options.endpoint)
        .done(function (json) {
            $container = $(container);
            $container.append($('<h3 />').text(options.title).addClass('text-center'));
            $list = $('<ul />');

            data = json.data;
            data.forEach(function (e) {
                $item = $('<li />');
                if (typeof options.keyName === 'function') {
                    $item.html(options.keyName(e));
                } else {
                    $item.html(e[options.keyName]);
                }
                $list.append($item);
            });
            $container.append($list);
        })
        .fail(logFailure);
}

function makeXYGraph(container, options) {
    $.getJSON(API_BASE + options.endpoint)
        .done(function (json) {
            data = json.data;
            $(container).highcharts({
                chart: {
                    type: options.type
                },
                title: {
                    text: options.title
                },
                subtitle: {
                    text: options.subtitle
                },
                xAxis: {
                    categories: data.map(function (e) {
                        if (typeof options.keyName === 'function') {
                            return options.keyName(e);
                        }
                        return e[options.keyName];
                    })
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: options.yTitle
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: options.label,
                    data: data.map(function (e) {
                        if (typeof options.valueName === 'function') {
                            return options.valueName(e);
                        }
                        return e[options.valueName];
                    })
                }]
            });
        })
        .fail(logFailure);
}

// first row
makeXYGraph('#most-active-people', {
    endpoint: 'gabrielfalcao/lettuce/most_active_people',
    type: 'bar',
    title: "Most active people",
    keyName: function (e) {
        return makeLink("http://github.com/" + e.term, e.term);
    },
    valueName: 'count',
    yTitle: 'Events',
    label: 'events'
});
makeXYGraph('#total-events-monthly', {
    endpoint: 'gabrielfalcao/lettuce/total_events_monthly',
    type: 'area',
    title: "Activity",
    subtitle: "Total monthly events",
    keyName: 'month',
    valueName: 'value',
    yTitle: 'Events',
    label: 'events'
});

// second row
makeXYGraph('#most-active-issues', {
    endpoint: 'gabrielfalcao/lettuce/most_active_issues',
    type: 'bar',
    title: "Most active issues",
    keyName: function (e) {
        return makeLink("http://github.com/gabrielfalcao/lettuce/issues/" + e.term,
                        "#" + e.term);
    },
    valueName: 'count',
    yTitle: 'Events',
    label: 'events'
});
makeList('#open-issues', {
    endpoint: 'gabrielfalcao/lettuce/open_issues',
    title: "Open issues",
    keyName: function (e) {
        return makeLink("http://github.com/gabrielfalcao/lettuce/issues/" + e,
                        "#" + e);
    }
});

// third row
makeList('#issues-without-comments', {
    endpoint: 'gabrielfalcao/lettuce/issues_without_comments',
    title: "Issues without comments",
    keyName: function (e) {
        return makeLink("http://github.com/gabrielfalcao/lettuce/issues/" + e,
                        "#" + e);
    }
});

/*
* Populate the User Issues card
*/
function getUserIssues () {

    $this = $('.js-handler--github-username');
    $this.data('timeout-id', '');
    var username = $this.val().trim();
    if (username) {
        $.get('http://localhost:5000/gabrielfalcao/lettuce/'+ username +'/issues_assigned')
            .success(function (data) {
                console.log(data);
                var source   = $("#user-issues").html();
                var template = Handlebars.compile(source);
                var issues = data.data.length ? data.data.join('') : 'No issues assigned to this user';
                var context = {user: username, list: issues}
                var html    = template(context);
                $('.template-user-issues').empty().append(html);

            })
            .fail(function (data) {
                $('.template-user-issues').empty().text('Failed to retrieve data');
            });
    }

}

/*
* Listen for keyup events and fetch data for specified user
* has a 200ms delay between keyup and actual GET request
* to prevent firing a cascade of requests
*/
$('.js-handler--github-username').on('keyup', function () {

    var timeout_id = parseInt($(this).data('timeout-id'), 10) || null;
    if (timeout_id) clearTimeout(timeout_id);
    timeout_id = setTimeout(getUserIssues, 200);
    $(this).data('timeout-id', timeout_id);

});



function populateTimeline(count, starting_from) {
    var $timeline = $('#timeline');
    var template = Handlebars.compile($('#timeline-item-template').html());

    $.get(API_BASE + 'gabrielfalcao/lettuce/recent_events',
          {count: count, starting_from: starting_from})
          .success(function(data) {
              data.data.forEach(function(e) {
                  mapping = TIMELINE_MAPPING[e.type];
                  if (!mapping) {
                      return;
                  }
                  context = {
                      author: formatAuthor(e.actor),
                      action: mapping.action(e),
                      object: mapping.object(e),
                      timestamp: e.created_at
                  };
                  if (mapping.link) {
                      context.link = mapping.link(e);
                  }
                  $timeline.append(template(context));
              });
          });
}

populateTimeline(200, 0);

