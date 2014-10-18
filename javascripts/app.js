window.Narly = (function() {
    var Step = Backbone.Model.extend({
        idAttribute: 'index'
    });

    // Steps collection
    var Steps = Backbone.Collection.extend({
        model: Step
        ,
        initialize : function(args) {
            this.courseName = args.courseName;
        }
        ,
        url : function() {
            return '/steps/' + this.courseName + '.json';
        }
        ,
        parse : function(rsp) {
            return rsp.steps;
        }
        ,
        // Hash represents a step # (not index).
        displayFromHash : function(hash) {
            var step = (hash === '') ? 1 : hash.replace('#', '')*1;
            if(_.isNaN(step)){ step = 1 };
            // convert to index.
            step = (step-1) < 1 ? 0 : step-1;

            return this.at(step).trigger('display', this.at(step));
        }
    })

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
            return { diffs: [], active: 'changes' };
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
            var diffs = [], contents = [];
            this.state.diffs.forEach(function(diff) {
                diffs.push(FileDiff(diff));
                diff.key = Math.random(); // need this to make sure file content changes.
                contents.push(FileContent(diff));
            });

            return React.DOM.div(null,
                        React.DOM.div({ className: "top-bar code" },
                            React.DOM.a({
                                    href: "#",
                                    className: (this.state.active === 'changes' ? 'active' : ''),
                                    onClick : this.changes
                                }, 'File Changes'),
                            React.DOM.a({
                                    href: "#",
                                    className: (this.state.active === 'contents' ? 'active' : ''),
                                    onClick : this.contents
                                }, 'File Contents')
                        ),
                        React.DOM.div({ className: "section-inner" },
                            React.DOM.div({
                                        className: "toggle diffs-wrap "
                                                   + (this.state.active === 'changes' ? 'active' : '')
                                    }, diffs),
                            React.DOM.div({
                                        className: "toggle contents-wrap "
                                                   + (this.state.active === 'contents' ? 'active' : ''),
                                        ref: 'contents'
                                    }, contents)
                       )
                   )
        }
        ,
        changes : function (e) {
            e.preventDefault();
            this.setState({ active : 'changes' });
        }
        ,
        contents : function (e) {
            e.preventDefault();
            this.setState({ active : 'contents' });
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

    // ControlsBar is the main Parent interface into lesson controls.
    // StartOver, StepStatus, PrevNext.
    var ControlsBar = React.createClass({
        displayName: 'ControlsBar'
        ,
        getInitialState: function() {
            return { index: 0, step: 1, total: 1 };
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
        getInitialState: function() {
            return { step: 1, total: 1};
        }
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
            var a = Narly.env.steps.at(0);
            a.trigger('display', a);
        }
    });

    var StepStatus = React.createClass({
        displayName: 'StepStatus'
        ,
        render: function() {
            return React.DOM.span({ id: 'step-status' },
                        "step " + this.props.step + " of " + this.props.total);
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
                        }, React.DOM.i({className: 'fa fa-chevron-right' })),
                    React.DOM.a({
                            href: "#",
                            onClick : this.prev
                        }, React.DOM.i({className: 'fa fa-chevron-left' }))
            );
        }
        ,
        prev : function(e) {
            e.preventDefault();
            var a = this.getStep(-1);
            a.trigger('display', a);
        }
        ,
        next : function(e) {
            e.preventDefault();
            var a = this.getStep(1);
            a.trigger('display', a);
        }
        ,
        getStep : function(direction) {
            var index = this.props.index;

            index += direction;

            if(index < 0) {
                index = (this.props.total - 1);
            }
            else if (index > (this.props.total - 1)) {
                index = 0;
            }

            return Narly.env.steps.at(index);
        }
    });

    function start(data) {
        Narly.env.steps = new Steps(data);
        Narly.env.steps.fetch({ success : function(collection) {
            var lessonPane = React.renderComponent(LessonPane(), document.getElementById('lesson-pane'));
            var codePane = React.renderComponent(CodePane(), document.getElementById('code-pane'));
            var controlsBar = React.renderComponent(ControlsBar(), document.getElementById('controls-bar'));

            collection.on('display', function(model) {
                lessonPane.setState({ content : model.get('lesson') });
                codePane.setState({
                    diffs : model.get('diffs'),
                    active: 'changes'
                });
                controlsBar.setState({
                    index: model.get('index'),
                    step: (model.get('index') + 1),
                    total: collection.length
                });
                window.location.hash = (model.get('index') + 1);
            });

            collection.displayFromHash(window.location.hash);
        }});
    }

    return {
        start : start
        ,
        env : {}
    }
})();
