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
                { class: 'diffs', name: 'File Changes', payload: [] },
                { class: 'contents', name: 'File Contents', payload: [] }
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
            return { courseName: null, active : 'result' };
        }
        ,
        render: function() {
            var tabs = [
                { class: 'result', name: 'Final Results',
                    payload: (
                        this.state.courseName
                            ? React.DOM.iframe({ src: "/steps/"+ this.state.courseName + ".html", seamless: 'seamless' })
                            : null
                        )
                },
                { class: 'source', name: 'Source Code',
                    payload: React.DOM.ul(null,
                                React.DOM.li(null, React.DOM.a({ href: '#' }, 'GitHub')),
                                React.DOM.li(null, React.DOM.a({ href: '#' }, 'Download ZIP'))
                             )
                },
                { class: 'works', name: 'How This Works',
                    payload:
                        React.DOM.div({
                            dangerouslySetInnerHTML: {
                              __html: this.state.works
                            }
                        })
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
            return React.DOM.span(null,
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
                            id: 'start-over',
                            title: 'Start Over',
                            onClick: this.startOver
                        },
                        React.DOM.svg({
                                "viewBox": "-9.5 5.5 24 24",
                                "enable-background": "new -9.5 5.5 24 24",
                                'xml:space':"preserve"
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
            return React.DOM.span({ id: 'step-status' },
                        "step " + this.props.index + " of " + this.props.total);
        }
    });

    var PrevNext = React.createClass({
        displayName: 'PrevNext'
        ,
        render: function() {
            return React.DOM.div({ id: 'prev-next' },
                    React.DOM.a({
                            href: "#",
                            onClick : this.next
                        },
                        React.DOM.svg({ "viewBox": "0 0 16 16" },
                            React.DOM.path({
                                d: "M.156 0l.125.125 7.906 7.875-8 8h5.625l6.594-6.594 1.438-1.406-1.438-1.406-6.563-6.594h-5.688z"
                            })
                        )
                    ),
                    React.DOM.a({
                            href: "#",
                            onClick : this.prev
                        },
                        React.DOM.svg({ "viewBox": "0 0 16 16" },
                            React.DOM.path({
                                d: "M10.188 0l-6.594 6.594-1.438 1.406 1.438 1.406 6.563 6.594h5.688l-.125-.125-7.906-7.875 8-8h-5.625z"
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
                React.DOM.a({
                        href: "#",
                        className: (self.state.active === tab.class ? 'active' : ''),
                        onClick : function(e) {
                            e.preventDefault();
                            self.setState({ active: tab.class });
                        }
                    }, tab.name)
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
