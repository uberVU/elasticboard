    (function(){

        'use strict';
        window.App = window.App || {};
        App.Insights = {};

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

        /*
            Issues Burndown widget
        */
        App.Insights.IssuesBurndown = Backbone.View.extend({
            el: $('#issues-activity'),
            title: 'Issues Burndown',
            subtitle: '# of issues opened vs closed',
            data: [],
            initialize: function() {
                var cb = this.drawIssuesActivity.bind(this);
                this.mode = $(this.el).find('select')[0].value;
                this.subtitle = '# of issues opened vs closed, ' + this.mode
                App.utils.httpGet(App.BASE + '/issues_activity?mode=' + this.mode, cb, displayFailMessage);
            },
            drawIssuesActivity: function(data) {
                this.data = data.data;
                var closed = data.data.closed;
                var opened = data.data.opened;
                var title = this.title;
                var subtitle = this.subtitle;

                var that = this;
                $(this.$el).find('.graph-container').highcharts({
                    chart: {
                        type: 'spline'
                    },
                    title: {
                        text: title
                    },
                    subtitle: {
                        text: subtitle
                    },
                    xAxis: {
                        categories: opened.map(function(e) {
                            if (that.mode === 'weekly') {
                                return e.weekStart + ' - ' + e.weekEnd;
                            }
                            return e.month;
                        })
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
            }
        });

        function drawIssuesWidget(labels, options, label) {
            var issuesListTemplate = Handlebars.compile($('#issues-list-template').html());

            labels.data.sort(function (a, b) {
                return a.name.toLowerCase() >= b.name.toLowerCase();
            });

            var url = App.BASE + options.endpoint;
            if (label) {
                url += '?label=' + label;
            }

            App.utils.httpGet(url, function(json) {
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
            }).complete(function() {
                $(options.selector + ' .widget-label--label-item').on('click', function() {
                    drawIssuesWidget(labels, options, $(this).data('label'));
                });
            });
        }

        App.Insights.avgIssueTime = Backbone.View.extend({
            el: $('#avg-issue-time'),
            sel: '#avg-issue-time',
            title: 'Average issue time',
            endpoint: '/avg_issue_time',
            subtitle: 'From the time it\'s opened until it\'s closed',
            initialize: function() {
                this.mode = $(this.el).find('select')[0].value;
                this.drawAvgIssueTime();
            },
            drawAvgIssueTime: function drawAvgIssueTime() {
                var that = this;
                App.utils.makeXYGraph(this.sel + ' .graph-container', {
                    endpoint: this.endpoint + '?mode=' + this.mode,
                    type: 'spline',
                    title: this.title,
                    subtitle: this.subtitle,
                    keyName: function(e) {
                        if (that.mode === 'weekly') {
                            return e.weekStart + ' - ' + e.weekEnd;
                        }
                        return e.month;
                    },
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
        });

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

        App.Insights.IssueInvolvement = Backbone.View.extend({
            el: $('#issues-involvement-graph-container'),
            options: {
                width: 0,
                height: 0,
                radius: 25,
                ratio: 1.5
            },
            initialize: function() {
                var url = App.BASE + '/issues_involvement';
                var cb = this.drawIssuesInvolvement.bind(this);
                App.utils.httpGet(url, cb, displayFailMessage);
            },
            drawIssuesInvolvement: function(json) {
                var width = this.$el.width();
                var height = this.$el.height();
                var radius = this.options.radius;
                var ratio = this.options.ratio;

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

                // clean up first
                $('#issues-involvement-graph-container').html('');
                // add the new content
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
            }
        });

        App.Insights.outstandingPullRequests = Backbone.View.extend({
            el: $('#outstanding-pull-requests'),

            template: Handlebars.compile($('#pull-requests-list-template').html()),

            initialize: function() {
                var endpoint = App.BASE + '/outstanding_pull_requests';
                var cb = this.addPullRequests.bind(this);
                App.utils.httpGet(endpoint, cb, displayFailMessage);
            },

            addPullRequests: function(data) {
                var prs = data.data;
                prs.forEach(function (e) {
                    e.last_activity = moment().from(e.last_activity, true);
                });
                var widget = this.template({
                    prs: prs,
                    title: "Outstanding Pull Requests",
                    subtitle: "(max. 20 results)"
                });
                this.$el.empty().append(widget);
            }
        });

        App.Insights.nonMergeablePullRequests = Backbone.View.extend({
            el: $('#non-mergeable-pull-requests'),

            template: Handlebars.compile($('#pull-requests-list-template').html()),

            initialize: function() {
                var endpoint = App.BASE + '/pull_requests';
                var cb = this.addPullRequests.bind(this);
                App.utils.httpGet(endpoint, cb, displayFailMessage);
            },

            addPullRequests: function(data) {
                var prs = data.data;
                prs = prs.filter(function (e) {
                    return e.merge_commit_sha === null;
                });
                prs.forEach(function (e) {
                    e.last_activity = moment().from(e.last_activity, true);
                });
                var widget = this.template({
                    prs: prs,
                    title: "Non Mergeable Pull Requests",
                    subtitle: "(max. 20 results)"
                });
                this.$el.empty().append(widget);
            }
        });


        //http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
        function extractLight(c) {
            var rgb = parseInt(c, 16);
            var r = (rgb >> 16) & 0xff;
            var g = (rgb >>  8) & 0xff;
            var b = (rgb >>  0) & 0xff;

            var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return luma < 70;
        }

        App.Insights.Milestones = Backbone.View.extend({
            el: $('#milestones'),

            template: Handlebars.compile($('#insights-milestone').html()),

            initialize: function() {
                var endpoint = App.BASE + '/milestones';
                var cb = this.addMilestones.bind(this);
                App.utils.httpGet(endpoint, cb, displayFailMessage);
            },

            addMilestones: function displayData(data) {
                var template = this.template;
                var milestones = [];
                $.each(data.data, function(idx, milestone) {

                    var due_date = 0;
                    var delay = false;

                    // determine if milestone goal is in the future
                    // or the date was missed. prefix with "in" or suffix "ago"
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
                    milestones.push(context);
                });
                this.$el.empty().append(template({milestones: milestones}));
            }
        });

        window.drawInsights = function drawInsights () {
            $('li[data-tab=tab-insights]').addClass('selected');
            var url = App.BASE + '/labels';
            App.utils.httpGet(url, function (labels) {
                drawIssuesWidget(labels, {
                    selector: '#untouched-issues',
                    endpoint: '/untouched_issues',
                    title: "Untouched Issues"
                });
                drawIssuesWidget(labels, {
                    selector: '#inactive-issues',
                    endpoint: '/inactive_issues',
                    title: "Inactive Issues (2 weeks)"
                });
                drawIssuesWidget(labels, {
                    selector: '#unassigned-issues',
                    endpoint: '/unassigned_issues',
                    title: "Unassigned Issues"
                });
            });

            window.widgets = {
                issueInvolvement: new App.Insights.IssueInvolvement(),
                milestones: new App.Insights.Milestones(),
                outstandingPullRequests: new App.Insights.outstandingPullRequests(),
                nonMergeablePullRequests: new App.Insights.nonMergeablePullRequests(),
                issuesBurndown: new App.Insights.IssuesBurndown(),
                avgIssueTime: new App.Insights.avgIssueTime()
            }

            // register handlers for weekly/monthly select
            $('.insight-select').on('change', function (e) {
                var $select = $(e.target);
                var widget = $select.data('widget');
                window.widgets[widget].initialize();
            });
        };

    })();
