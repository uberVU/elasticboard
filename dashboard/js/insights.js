(function(){

    'use strict';
    window.App = window.App || {};

    Handlebars.registerHelper('eachLabel', function(context, options) {
        if (!context) return;
        var ret = "";
        for(var i=0, j=context.length; i<j; i++) {
            context[i]['label-color'] = extractLight(context[i]['color']) ? 'label-color-white' : 'label-color-dark';
            ret = ret + options.fn(context[i]);
        }

        return ret;
    });

    var tooltipUserTemplate = Handlebars.compile($('#tooltip-user-template').html());
    var tooltipIssueTemplate = Handlebars.compile($('#tooltip-issue-template').html());

    function drawIssuesActivity() {
        $.getJSON(App.BASE + '/issues_activity')
            .done(function (json) {
                var data = json.data;
                var opened = data.opened;
                var closed = data.closed;
                $('#issues-activity').highcharts({
                    chart: {
                        type: 'spline'
                    },
                    title: {
                        text: 'Issues Burndown'
                    },
                    subtitle: {
                        text: '# of issues opened vs closed, monthly'
                    },
                    xAxis: {
                        categories: opened.map(function(e) { return e.month; })
                    },
                    yAxis: {
                        min: 0,
                    title: {
                        text: '# Issues'
                    }
                    },
                    legend: {
                        enabled: true
                    },
                    tooltip: {
                        shared: true
                    },
                    series: [
                    {
                        name: 'Opened',
                        data: opened.map(function(e) { return e.value; }),
                        lineColor: '#FF4E50',
                        color: '#FF4E50'
                    },
                    {
                        name: 'Closed',
                        data: closed.map(function(e) { return e.value; }),
                        lineColor: '#88C425',
                        color: '#88C425'
                    }
                ]
                });
            })
        .fail(displayFailMessage);
    }

    var issuesListTemplate = Handlebars.compile($('#issues-list-template').html());

    function drawIssuesWidget(labels, options, label) {
        labels.data.sort(function (a, b) {
            return a.name.toLowerCase() >= b.name.toLowerCase();
        });

        var url = App.BASE + options.endpoint;
        if (label) {
            url += '?label=' + label;
        }

        $.getJSON(url)
            .done(function(json) {
                var data = json.data;
                var context = {
                    title: options.title,
                subtitle: "(max. 20 results)",
                label: labels.data
                };
                if (!data.length) {
                    context.issues = [{
                        title: 'No issues matching your request'
                    }];
                } else {
                    context.issues = data;
                }
                var $list = $(issuesListTemplate(context));
                $(options.selector).empty().append($list);
            })
        .fail(displayFailMessage)
            .complete(function() {
                $(options.selector + ' .widget-label--label-item').on('click', function() {
                    drawIssuesWidget(labels, options, $(this).data('label'));
                });
            });
    }

    function drawAvgIssueTime() {
        App.utils.makeXYGraph('#avg-issue-time', {
            endpoint: '/avg_issue_time',
        type: 'spline',
        title: "Average Issue Time",
        subtitle: "From the time it's opened until it's closed",
        keyName: 'month',
        valueName: function(e) {
            var m = moment.duration(e.value, 'seconds');
            return {
                name: m.humanize(),
                y: Math.ceil(e.value / (3600 * 24))
            };
        },
        yTitle: 'Days',
        label: 'days'
        });
    }

    function makeD3Graph(issues_data) {
        var nodes = [];
        var links = [];
        for (var number in issues_data) {
            var user_nodes = [];
            var issue = issues_data[number];
            issue.users.forEach(function(user) {
                var node = {
                    type: 'user',
                data: user
                };
                nodes.push(node);
                user_nodes.push(node);
            });
            var issue_node = {
                type: 'issue',
                data: issue.issue
            };
            nodes.push(issue_node);

            // make links
            user_nodes.forEach(function(node) {
                var link = {
                    source: node,
                target: issue_node
                };
                links.push(link);
            });
        }
        return {
            nodes: nodes,
            links: links
        };
    }

    function drawIssuesInvolvement() {
        var url = App.BASE + '/issues_involvement';
        App.utils.httpGet(url, function(json) {
            var $container = $('#issues-involvement-graph-container');
            var width = $container.width();
            var height = $container.height();
            var radius = 25;
            var ratio = 1.5;

            var graph_data = makeD3Graph(json.data);
            var nodes = graph_data.nodes;
            var links = graph_data.links;

            var force = d3.layout.force()
            .charge(-350)
            .linkDistance(80)
            .gravity(0.05)
            .size([width, height]);

            var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            var context;
            var template;
            if (d.type == 'issue') {
                context = {
                    number: d.data.number,
            title: d.data.title,
            url: d.data.html_url,
            comments: d.data.comments,
            ago: moment().from(d.data.created_at, true)
                };
                template = tooltipIssueTemplate;
            } else {
                context = {
                    login: d.data.login,
            imgURL: d.data.avatar_url
                };
                template = tooltipUserTemplate;
            }
            return template(context);
        });

        var svg = d3.select('#issues-involvement-graph-container').append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('mousedown', tip.hide);

        svg.call(tip);

        force.nodes(nodes)
            .links(links)
            .start();

        var link = svg.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", 2);

        var gnodes = svg.selectAll('g.gnode')
            .data(nodes)
            .enter()
            .append('g')
            .classed('gnode', true)
            .call(force.drag);

        var nodes = gnodes.append('circle')
            .attr('class', 'node')
            .attr("r", function(d) {
                if (d.type == 'issue') {
                    return radius;
                }
                return radius / ratio;
            })
        .style("fill", function(d) {
            if (d.type == 'issue') {
                return '#FF4E50';
            }
            return '#88C425';
        });

        var labels = gnodes.append('text')
            .attr('class', 'textnode')
            .attr('dx', function (d) {
                if (d.type == 'issue') {
                    return radius + 3;
                }
                return radius / ratio + 3;
            })
        .attr('dy', 6)
            .style('fill', 'white')
            .text(function(d) {
                if (d.type == 'issue') {
                    return '#' + d.data.number;
                }
                return d.data.login;
            })
        .on('mousedown', function(e) {
            d3.event.stopPropagation();
            tip.show(e);
        });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        gnodes.attr("transform", function(d) {
            return 'translate(' + [d.x, d.y] + ')';
                });


            // http://mbostock.github.io/d3/talk/20110921/bounding.html
            var rl = radius + 5;
            gnodes.attr("cx", function(d) { return d.x = Math.max(rl, Math.min(width - rl, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(rl, Math.min(height - rl, d.y)); });
            });
        });
    }

    function addMilestoneStatus() {

        var endpoint = App.BASE + '/milestones';
        var $milestones = $('#milestones');

        App.utils.httpGet(endpoint, displayData, displayFailMessage);

        function displayData(data) {
            if (data.data.length) {

                var template = Handlebars.compile($('#insights-milestone').html());

                $.each(data.data, function(idx, milestone) {

                    var due_date = 0;
                    var delay = false;

                    if (milestone.due_on) {
                        var start = moment(new Date());
                        var end = moment((new Date(milestone.due_on)).getTime());
                        due_date = start.from(end, true);
                        if ((new Date(milestone.due_on)).getTime() > (new Date()).getTime()) {
                            due_date = 'in ' + due_date;
                        } else {
                            due_date += ' ago';
                            delay = true;
                        }
                    }

                    var context = {
                        closed: milestone.closed_issues,
                    opened: milestone.open_issues,
                    title: milestone.title,
                    url: 'https://github.com/' + App.REPO + '/issues?state=open&milestone=' + milestone.number,
                    due: due_date,
                    progress: parseInt(milestone.closed_issues / (milestone.closed_issues + milestone.open_issues) * 100, 10),
                    delay: delay
                    };

                    $milestones.append(template(context));
                });
            } else {
                $($milestones).append($('<p class="muted text-center">No milestones available.</p>'));
            }
        }
    }

    var pullRequestListTemplate = Handlebars.compile($('#pull-requests-list-template').html());

    function drawOutstandingPullRequests() {
        var url = App.BASE + '/outstanding_pull_requests';
        App.utils.httpGet(url, function (data) {
            var prs = data.data;
            prs.forEach(function (e) {
                e.last_activity = moment().from(e.last_activity, true);
            });
            var $widget = $(pullRequestListTemplate({
                prs: prs,
                title: "Outstanding Pull Requests",
                subtitle: "(max. 20 results)"
            }));
            $('#outstanding-pull-requests').append($widget);
        }, displayFailMessage);
    }

    //http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
    function extractLight(c) {
        var rgb = parseInt(c, 16);
        var r = (rgb >> 16) & 0xff;
        var g = (rgb >>  8) & 0xff;
        var b = (rgb >>  0) & 0xff;

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma < 70;
    }

    window.drawInsights = function drawInsights () {
        drawIssuesActivity();
        var url = App.BASE + '/labels';
        App.utils.httpGet(url, function (labels) {
            drawIssuesWidget(labels, {
                selector: '#untouched-issues',
                endpoint: '/untouched_issues',
                title: "Inactive Issues (2 weeks)"
            });
            drawIssuesWidget(labels, {
                selector: '#inactive-issues',
                endpoint: '/inactive_issues',
                title: "Untouched Issues"
            });
            drawIssuesWidget(labels, {
                selector: '#unassigned-issues',
                endpoint: '/unassigned_issues',
                title: "Unassigned Issues"
            });
        });
        drawOutstandingPullRequests();
        drawAvgIssueTime();
        drawIssuesInvolvement();
        addMilestoneStatus();
    };

})();
