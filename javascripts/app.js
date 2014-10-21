window.Narly = (function() {
    // Steps collection
    var Steps = function(args) {
        var _data = [],
            isSynced
        ;

        this.display = display;
        this.add = add;
        this.total = total;

        function display(index) {
            // Optimize the display of the homepage by not requiring fetch().
            if(index === 0 || isSynced) {
                Narly.dispatch.trigger('display', [get(index)]);
            }
            else {
                $.ajax({
                    url: '/steps/' + args.courseName + '.json',
                    dataType: "JSON"
                })
                .done(function(rsp) {
                    isSynced = true;
                    rsp.steps.forEach(function(step, i) {
                        step.index = i+1;
                    });

                    add(rsp.steps);

                    Narly.dispatch.trigger('display', [get(index)]);
                })
            }
        }

        function add(array) {
            Array.prototype.push.apply(_data, array);
        }

        function get(index) {
            return _data[index];
        }

        function total() {
            return _data.length;
        }
    };

    var LessonPane = React.createClass({
        displayName: 'LessonPane'
        ,
        getInitialState: function() {
            return { content: null };
        }
        ,
        render: function() {
            return React.DOM.div({ className: "section-inner" },
                        React.DOM.div({
                            className: "readme-content",
                            dangerouslySetInnerHTML: {
                              __html: this.state.content
                            }
                        })
                   );
        }
    });

    var CodePane = React.createClass({
        displayName: 'CodePane'
        ,
        getInitialState: function() {
            return { diffs: [], active: 'diffs' };
        }
        ,
        componentDidUpdate : function() {
            if(this.state.active === 'contents') {
                $(this.refs.contents.getDOMNode()).find('textarea')
                    .each(function() {
                        $(this).height($(this).prop('scrollHeight'));
                    });
            }
        }
        ,
        render: function() {
            var tabs = [
                { class: 'diffs', payload: [],
                    icon: [
                        React.DOM.svg({
                                "viewBox": "0 0 100 100",
                                width: '30px'
                            },
                            React.DOM.path({
                                d: "M41.322,45.361H29.48V33.52c0-1.074-0.878-1.953-1.952-1.953h-5.371c-1.075,0-1.954,0.879-1.954,1.953   v11.842H8.361c-1.073,0-1.953,0.879-1.953,1.953v5.372c0,1.073,0.88,1.952,1.953,1.952h11.842V66.48   c0,1.075,0.879,1.953,1.954,1.953h5.371c1.074,0,1.952-0.878,1.952-1.953V54.639h11.842c1.074,0,1.953-0.879,1.953-1.952v-5.372   C43.275,46.24,42.396,45.361,41.322,45.361z"
                            }),
                            React.DOM.path({
                                d: "M91.64,45.361H58.679c-1.075,0-1.953,0.879-1.953,1.953v5.372c0,1.073,0.878,1.952,1.953,1.952H91.64   c1.073,0,1.952-0.879,1.952-1.952v-5.372C93.592,46.24,92.713,45.361,91.64,45.361z"
                            })
                        ),
                        'changes'
                    ]
                },
                {
                    class: 'contents', payload: [],
                    icon: [
                        React.DOM.svg({
                                "viewBox": "0 0 100 100",
                                width: '30px'
                            },
                            React.DOM.path({
                                d: "M2.343,54.1C0.938,53.162,0,51.289,0,49.648c0-1.64,0.703-3.162,2.46-3.982H2.343c8.317-4.92,19.915-11.48,27.647-16.049  v10.895c-3.046,1.757-7.146,3.749-17.455,9.255l0.117,0.116c5.506,2.461,11.832,6.209,17.338,9.489v11.012L2.343,54.1z"
                            }),
                            React.DOM.path({
                                d: "M97.657,45.9c1.404,0.938,2.343,2.812,2.343,4.452c0,1.64-0.703,3.162-2.461,3.982h0.118  c-8.317,4.92-19.916,11.48-27.647,16.049V59.488c3.046-1.756,7.146-3.748,17.455-9.254l-0.117-0.116  c-5.505-2.461-11.832-6.209-17.338-9.489V29.617L97.657,45.9z"
                            })
                            ,
                            React.DOM.path({
                                d: "M46.401,71.844H39.39L53.48,28.156h7.13L46.401,71.844z"
                            })
                        ),
                        'code'
                    ]
                }
            ];


            this.state.diffs.forEach(function(diff) {
                tabs[0].payload.push(FileDiff(diff));
                diff.key = Math.random(); // need this to make sure file content changes.
                tabs[1].payload.push(FileContent(diff));
            });
            var output = generateReactTabs(tabs, this);

            return React.DOM.div(null,
                        React.DOM.div({ className: "top-bar code" }, output.tabs),
                        React.DOM.div({ className: "section-inner" }, output.sections)
                   );
        }
    });

    var FileDiff = React.createClass({
        displayName: 'FileDiff'
        ,
        render: function() {
            return React.DOM.div({
                            className: "diff-file " + this.props.status
                        },
                        React.DOM.div({ className: "diff-header" },
                            React.DOM.strong(null, this.props.path)
                        ),
                        React.DOM.div({
                            className: "diff-content",
                            dangerouslySetInnerHTML: {
                              __html: this.props.html
                            }
                        })
            );
        }
    });

    var FileContent = React.createClass({
        displayName: 'FileContent'
        ,
        render: function() {
            return React.DOM.div({ className: 'content-wrap' },
                        React.DOM.div({ className: "content-header" },
                            React.DOM.strong(null, this.props.path)
                        ),
                        React.DOM.textarea({
                                spellCheck: 'false',
                                defaultValue: this.props.content
                            }
                        )
                   );
        }
    });

    var HomePane = React.createClass({
        displayName: 'HomePane'
        ,
        getInitialState: function() {
            return { courseName: null, active : 'demo' };
        }
        ,
        render: function() {
            var tabs = [
                { class: 'demo',
                    payload: (
                        this.state.courseName
                            ? React.DOM.iframe({ src: "/steps/"+ this.state.courseName + "-demo.html", seamless: 'seamless' })
                            : null
                        ),
                    icon: [
                        React.DOM.svg({
                                "viewBox": "0 0 100 100",
                                width: '30px'
                            },
                            React.DOM.path({
                                d: "M76.1618449,18.6433479 L86.8851316,27.6412539 C87.3112368,27.9987985 87.3631973,28.6285973 87.0071338,29.0529372 L43.3014211,81.1393773 C43.0807605,81.4023504 42.7559402,81.5236886 42.4400343,81.4944043 C42.2374084,81.4781838 42.0372772,81.4004766 41.8690111,81.2592846 L12.7727666,56.8446366 C12.3441215,56.4849606 12.2880367,55.8529397 12.6433479,55.4294962 L21.6412539,44.7062095 C21.9987985,44.2801043 22.6305811,44.2298085 23.0573684,44.5879255 L40.6784316,59.3737532 L74.7504227,18.7683355 C75.1078026,18.3424266 75.7384014,18.2880367 76.1618449,18.6433479 Z M76.1618449,18.6433479"
                            })
                        ),
                        'demo'
                    ]
                },
                { class: 'download',
                    payload: React.DOM.ul(null,
                                React.DOM.li(null,
                                    React.DOM.a({ href: this.state.website, target: "_blank" }, 'GitHub')
                                ),
                                React.DOM.li(null,
                                    React.DOM.a({ href: this.state.download, target: "_blank" }, 'Download ZIP')
                                )
                             ),
                    icon: [
                        React.DOM.svg({
                                "viewBox": "0 0 100.001 78.688",
                                width: '30px'
                            },
                            React.DOM.path({
                                d: "M81.148,59.837H59.837v-4.92h21.312l0,0c7.697-0.002,13.936-5.519,13.936-13.06"
                                        +'c0-7.544-6.24-13.994-13.938-13.994c-3.875,0-7.377,1.636-9.902,4.218c0.041-0.578,0.068-1.162,0.068-1.754'
                                        +'c0-13.582-10.121-25.411-23.771-25.411c-11.489,0-21.639,8.385-24.564,19.137c-0.941-0.183-1.904-0.289-2.886-0.289'
                                        +'c-8.6,0-15.171,7.355-15.171,15.957s7.371,15.195,15.969,15.195c0.145,0,0.282-0.019,0.424-0.022v0.022h18.852v4.92H21.312'
                                        +'C9.975,59.837,0,51.467,0,40.163c0-11.022,8.751-20.848,19.672-21.312C24.281,7.854,34.956,0,47.54,0'
                                        +'c14.438,0,25.8,10.421,28.632,23.956c1.559-0.421,3.288-1.005,4.977-1.005c10.463,0,18.853,8.665,18.853,18.852'
                                        +'C100.001,51.99,91.611,59.837,81.148,59.837z'
                            }),
                            React.DOM.polygon({
                                points: "45.902,43.441 54.1,43.441 54.1,68.034 59.837,68.034 50,78.688 40.163,68.034 45.902,68.034"
                            })
                        ),
                        'download'
                    ]
                },
                { class: 'works',
                    payload:
                        React.DOM.div(null,
                            React.DOM.p(null, 'The tutorial shows step by step code changes. Removed code is red while added code is green. Navigate the steps by the orange back and forward arrows -- the keyboard arrows work as well.'),
                            React.DOM.p(null, 'Test and run the code yourself at any time by downloading the source, then clicking "View File" on the top right of the code to copy that file\'s contents at that given step.')
                        ),
                    icon: [
                        React.DOM.svg({
                                "viewBox": "0 0 100 100",
                                width: '30px'
                            },
                            React.DOM.path({
                                d: "M41,69h15v14H41V69z M68.658,29.173c-0.676-1.96-1.795-3.761-3.331-5.354  c-1.532-1.589-3.568-2.896-6.056-3.886c-2.467-0.979-5.519-1.476-9.068-1.476c-2.343,0-4.566,0.265-6.617,0.787  c-2.03,0.525-3.888,1.206-5.522,2.024c-1.655,0.829-3.139,1.768-4.407,2.788c-1.275,1.027-2.361,2.045-3.184,3.064  c-0.826,1.025-2.263,2.891-2.263,4.757c0,3.346,2.713,6.061,6.061,6.061c0.914,0,1.822-0.124,2.555-0.57  c0.728-0.441,1.646-1.268,2.559-2.245c1.137-1.217,2.691-1.974,4.22-2.703c1.917-0.914,3.956-1.377,6.06-1.377  c1.877,0,3.269,0.449,4.136,1.333c0.891,0.91,1.322,1.854,1.322,2.889c0,0.511-0.107,0.987-0.328,1.446  c-0.277,0.571-0.631,1.115-1.054,1.623c-0.449,0.542-0.97,1.073-1.55,1.582c-0.631,0.557-1.248,1.088-1.863,1.598  c-1.334,1.12-2.538,2.244-3.578,3.339c-1.091,1.146-2.03,2.385-2.794,3.684C43.173,49.871,41,56.469,41,58.611V61h15v-2.389  c0-1.293,0.434-5.123,0.975-5.855c0.562-0.771,1.203-1.469,1.906-2.078c0.747-0.652,1.547-1.279,2.389-1.872  c0.963-0.696,1.938-1.468,2.898-2.296c1.02-0.879,1.938-1.87,2.734-2.95c0.82-1.111,1.488-2.398,1.981-3.824  c0.5-1.436,0.753-3.123,0.753-5.013C69.639,32.944,69.309,31.078,68.658,29.173z"
                            })
                        ),
                        'usage'
                    ]
                }

            ];
            var output = generateReactTabs(tabs, this);

            return React.DOM.div(null,
                        React.DOM.div({ className: "top-bar code" }, output.tabs),
                        React.DOM.div({ className: "sections-wrap" }, output.sections)
                   );
        }
    });

    // ControlsBar is the main Parent interface into lesson controls.
    // StartOver, StepStatus, PrevNext.
    var ControlsBar = React.createClass({
        displayName: 'ControlsBar'
        ,
        getInitialState: function() {
            return { index: 0, total: 1 };
        }
        ,
        render: function() {
            return React.DOM.div(null,
                        StartOver(),
                        StepStatus(this.state),
                        PrevNext(this.state)
                   );
        }
    });

    var StartOver = React.createClass({
        displayName: 'StartOver'
        ,
        render: function() {
            return React.DOM.div({ 
                            className: 'start-over',
                            title: 'Start Over',
                            onClick: this.startOver
                        },
                        React.DOM.svg({
                                "viewBox": "-9.5 5.5 24 24"
                            },
                            React.DOM.path({
                                d: "M-7.5,15.5v-8l2.937,2.937C-2.71,8.576-0.199,7.5,2.5,7.5c5.514,0,10,4.486,10,10c0,5.514-4.486,10-10,10  c-4.174,0-7.946-2.631-9.387-6.546c-0.191-0.519,0.075-1.094,0.593-1.284c0.517-0.189,1.093,0.074,1.284,0.593  C-3.857,23.396-0.839,25.5,2.5,25.5c4.411,0,8-3.589,8-8s-3.589-8-8-8c-2.159,0-4.167,0.861-5.651,2.349L0.5,15.5H-7.5z"
                            })
                        )
                    );
        }
        ,
        startOver : function(e) {
            e.preventDefault();
            Narly.steps.display(0);
        }
    });

    var StepStatus = React.createClass({
        displayName: 'StepStatus'
        ,
        render: function() {
            return React.DOM.span({ className: 'step-status' },
                        "Step " + this.props.index + " of " + this.props.total);
        }
    });

    var PrevNext = React.createClass({
        displayName: 'PrevNext'
        ,
        render: function() {
            return React.DOM.div({ className: 'prev-next' },
                    React.DOM.a({
                            href: "#",
                            onClick : this.next
                        },
                        React.DOM.svg({ "viewBox": "0 0 32 32" },
                            React.DOM.circle({ r: 10, cy: 16, cx: 16 }),
                            React.DOM.path({
                                d: "M32,16c0-8.835-7.164-16-16-16S0,7.164,0,16s7.164,16,16,16S32,24.835,32,16z M14.535,23.456  c-0.746-0.746-0.746-1.953,0-2.699l2.793-2.758H9.938C8.867,17.999,8,17.132,8,16.062v-0.125C8,14.867,8.867,14,9.938,14h7.363  l-2.766-2.734c-0.746-0.746-0.746-1.953,0-2.699c0.754-0.742,1.973-0.746,2.727,0l6.156,6.098c0.746,0.742,0.746,1.953,0,2.698  l-6.156,6.094C16.508,24.202,15.289,24.202,14.535,23.456z"
                            })
                        )
                    ),
                    React.DOM.a({
                            href: "#",
                            onClick : this.prev
                        },
                        React.DOM.svg({ "viewBox": "0 0 32 32" },
                            React.DOM.circle({ r: 10, cy: 16, cx: 16 }),
                            React.DOM.path({
                                transform: "scale(-1 1) translate(-32 0)",
                                d: "M32,16c0-8.835-7.164-16-16-16S0,7.164,0,16s7.164,16,16,16S32,24.835,32,16z M14.535,23.456  c-0.746-0.746-0.746-1.953,0-2.699l2.793-2.758H9.938C8.867,17.999,8,17.132,8,16.062v-0.125C8,14.867,8.867,14,9.938,14h7.363  l-2.766-2.734c-0.746-0.746-0.746-1.953,0-2.699c0.754-0.742,1.973-0.746,2.727,0l6.156,6.098c0.746,0.742,0.746,1.953,0,2.698  l-6.156,6.094C16.508,24.202,15.289,24.202,14.535,23.456z"
                            })
                        )
                    )
            );
        }
        ,
        prev : function(e) {
            e.preventDefault();
            Narly.steps.display(this.getIndex(-1));
        }
        ,
        next : function(e) {
            e.preventDefault();
            Narly.steps.display(this.getIndex(1));
        }
        ,
        getIndex : function(direction) {
            var index = this.props.index;

            index += direction;

            if(index < 0) {
                index = (this.props.total - 1);
            }
            else if (index > (this.props.total - 1)) {
                index = 0;
            }

            return index;
        }
    });

    // Generate React Tab-based navigation component.
    // @param[Array] data - array of objects:
    // {  name: <tab display name>,
    //    class: <class name identifier>,
    //    payload: <section content (as compatable with React.DOM argument> }
    function generateReactTabs(data, self) {
        var output = { tabs: [], sections: []};
        data.forEach(function(tab) {
            output.tabs.push(
                React.DOM.div({
                            className: (self.state.active === tab.class ? 'active' : ''),
                            onClick : function() {
                                self.setState({ active: tab.class });
                            }
                        },
                        (tab.icon || tab.class)
                )
            );
            output.sections.push(
                React.DOM.div({
                        className: "toggle " + tab.class + "-wrap "
                                   + (self.state.active === tab.class ? 'active' : ''),
                        ref: tab.class
                    }, tab.payload)
            );
        })

        return output;
    }

    // Get the index from url hash.
    function indexFromHash(hash) {
        var step = (hash === '') ? 0 : hash.replace('#', '')*1;
        if(_.isNaN(step)){ step = 0 };

        return (step < 1) ? 0 : step;
    }

    function start(data) {
        Narly.dispatch = new EventEmitter();

        Narly.steps = new Steps(data);
        Narly.steps.add([data]);

        var controlsBar = React.renderComponent(ControlsBar(), document.getElementById('controls-bar'));
        var lessonPane = React.renderComponent(LessonPane(), document.getElementById('lesson-pane'));
        var homePane = React.renderComponent(HomePane(), document.getElementById('home-pane'));
        var codePane = React.renderComponent(CodePane(), document.getElementById('code-pane'));

        Narly.dispatch.on('display', function(step) {
            var index = step.index,
                className;
            ;
            lessonPane.setState({ content : step.lesson });

            // homepage
            if(index === 0) {
                homePane.setState(step);
                className = 'home';
            }
            else {
                codePane.setState({
                    diffs : step.diffs,
                    active: 'diffs'
                });
                className = 'code';
            }

            // Hack way to toggle codePane vs HomePane
            document.getElementsByTagName('body')[0].className = className;
            window.location.hash = index;
            controlsBar.setState({ index: index });
        });

        controlsBar.setState({ total: data.total });
        Narly.steps.display(indexFromHash(window.location.hash));
    }

    return {
        start : start
    }
})();
