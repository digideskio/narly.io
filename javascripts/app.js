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
        getPrevFromActive : function() {
            return this.getFromActive(-1);
        }
        ,
        getNextFromActive : function() {
            return this.getFromActive(1);
        }
        ,
        getFromActive : function(direction) {
            var active = this.get(this.activeId),
                index = this.indexOf(active),
                max = this.length-1;

            index += direction; 

            if(index < 0) {
                index = max;
            }
            else if (index > max) {
                index = 0;
            }

            return this.at(index);
        }
        ,
        // Hash represents a step # (not index).
        displayFromHash : function(hash) {
            var step = (hash === '') ? 1 : hash.replace('#', '')*1;
            if(_.isNaN(step)){ step = 1 };
            // convert to index.
            step = (step-1) < 1 ? 0 : step-1;

            return this.at(step).trigger('display');
        }
    })

    // Steps collection View
    var StepsView = Backbone.View.extend({
        collection : Steps
        ,
        initialize : function() {
            var self = this;

            $("#main-commit-container").on('click', '.show-content', function() {
                $(this)
                    .toggleClass('active')
                    .next('textarea')
                        .toggle();
            });
            $('#start-over').click(function(e) {
                self
                    .collection
                    .at(0)
                    .trigger('display');

                e.preventDefault();
            })

            this.collection.each(function(model) {
              new Narly.StepView({ model : model });
            })

            // Left/Right arrow navigation.
            $(document).keydown(function(e) {
                if ([37, 39].indexOf(e.keyCode) > -1) {
                    var direction = (e.keyCode == 37) ? -1 : 1;
                    self
                        .collection
                        .getFromActive(direction)
                        .trigger('display');

                    return false;
                }
            })
        }
    })

    var StepView = Backbone.View.extend({
        model : Step
        ,
        attributes : {
            id: "commit-container"
        }
        ,
        initialize : function() {
            this.model.on('display', this.render, this);
            this.template = $("#commit-container-template").html();
        }
        , 
        render : function() {
            this.model.collection.activeId = this.model.id;

            var payload = this.model.attributes;
            payload.hasDiffs = payload.diffs.length > 0;
            var content = Mustache.render(this.template, payload);
            var view = this.$el.html(content);

            $("#main-commit-container").html(view);

            window.location.hash = (this.model.get('index') + 1);

            Narly.$body.scrollTop(0);
            $("#step-status")
                .text(
                    "step " + (this.model.get('index') + 1)
                    + " of " + this.model.collection.length
                );
        }
    })

    var TopBar = Backbone.View.extend({
        events : {
            'click a.toc-toggle' : 'tocToggle'
        }
        ,
        tocToggle : function(e) {
          e.preventDefault();
          $('body').toggleClass('toc-expand');
        }
    });

    var PrevNextView = Backbone.View.extend({
        collection : Steps
        ,
        events : {
            'click a.prev' : 'prev',
            'click a.next' : 'next'
        }
        ,
        prev : function(e) {
            e.preventDefault();
            this
                .collection
                .getPrevFromActive()
                .trigger('display');
        }
        ,
        next : function(e) {
            e.preventDefault();
            this
                .collection
                .getNextFromActive()
                .trigger('display');
        }
    })

    return {
        $body : $('body')
        ,
        env : {}
        ,
        Step : Step
        ,
        Steps : Steps
        ,
        StepsView : StepsView
        ,
        StepView : StepView
        ,
        TopBar : TopBar
        ,
        PrevNextView : PrevNextView
    }
})();
