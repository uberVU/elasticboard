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
        .fail(displayFailMessage);
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
        .fail(displayFailMessage);
}

/*
* Populate the User Issues card
*/
function getUserIssues () {

    $this = $('.js-handler--github-username');
    $this.data('timeout-id', '');
    var username = $this.val().trim();
    if (username) {
        $.get(API_BASE + username +'/issues_assigned')
            .success(function (data) {
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

function makeStackedSeries(data) {
    var seriesNames = [];
    for (var i = 0; i < data.length; ++i) {
        var values = data[i].value;
        var keys = Object.keys(values);
        for (var j = 0; j < keys.length; ++j) {
            var category = keys[j];
            if (seriesNames.indexOf(category) === -1) {
                seriesNames.push(category);
            }
        }
    }

    var series = [];
    for (var i = 0; i < seriesNames.length; ++i) {
        var s = {
            name: seriesNames[i],
            data: []
        };
        for (var j = 0; j < data.length; ++j) {
            var d = data[j].value;
            if (d[s.name]) {
                s.data.push(d[s.name]);
            } else {
                s.data.push(0);
            }
        }
        series.push(s);
    }
    return series;
}

function makeStackedAreaGraph(container, options) {
    $(container).highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: options.title
        },
        subtitle: {
            text: options.subtitle
        },
        xAxis: {
            categories: options.categories,
            title: {
                enabled: true
            }
        },
        yAxis: {
            title: {
                text: options.yTitle
            },
            min: 0
        },
        legend: {
            labelFormatter: options.legendFormatter
        },
        tooltip: {
            shared: true,
            valueSuffix: ' ' + options.suffix,
            formatter: options.tooltipFormatter
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                fillOpacity: 1,
                lineColor: '#666666',
                lineWidth: 1,
                marker: {
                    enabled: false
                }
            }
        },
        series: options.series
    });
}

function drawActivityGraph() {
    $.getJSON(API_BASE + '/total_events_monthly')
        .done(function(data) {
            var series = makeStackedSeries(data.data);
            var categories = data.data.map(function (e) {
                return e.month;
            });

            var options = {
                title: "Activity",
                subtitle: "Total monthly events",
                yTitle: 'Events',
                suffix: 'events',
                series: series,
                categories: categories,
                legendFormatter: function () {
                    var label = this.name;
                    var idx = label.indexOf("event");
                    return label.substr(0, idx);
                }
            };
            makeStackedAreaGraph('#total-events-monthly', options);
        })
        .fail(displayFailMessage);
}

function drawGraphs() {
    makeXYGraph('#most-active-people', {
        endpoint: '/most_active_people',
        type: 'bar',
        title: "Most active people",
        keyName: function (e) {
            return makeLink("http://github.com/" + e.term, e.term);
        },
        valueName: 'count',
        yTitle: 'Events',
        label: 'events'
    });

    drawActivityGraph();

    makeXYGraph('#most-active-issues', {
        endpoint: '/most_active_issues',
        type: 'bar',
        title: "Most active issues",
        keyName: function (e) {
            return makeLink('http://github.com/' + REPO + '/issues/' + e.term,
                            "#" + e.term);
        },
        valueName: 'count',
        yTitle: 'Events',
        label: 'events'
    });

    /*
    makeList('#issues-without-comments', {
        endpoint: 'gabrielfalcao/lettuce/issues_without_comments',
        title: "Issues without comments",
        keyName: function (e) {
            return makeLink("http://github.com/gabrielfalcao/lettuce/issues/" + e,
                            "#" + e);
        }
    });
   */

    /*
    * Listen for keyup events and fetch data for specified user
    * has a 200ms delay between keyup and actual GET request
    * to prevent firing a cascade of requests
    */
   /*
    $('.js-handler--github-username').off('keyup');
    $('.js-handler--github-username').on('keyup', function () {

        var timeout_id = parseInt($(this).data('timeout-id'), 10) || null;
        if (timeout_id) clearTimeout(timeout_id);
        timeout_id = setTimeout(getUserIssues, 200);
        $(this).data('timeout-id', timeout_id);

    });
   */
}

