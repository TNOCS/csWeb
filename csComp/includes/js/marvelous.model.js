var Marvelous = (function() {

    var currentmodel;
    var widgetHeightMargin = 25; // content offset from widget top
    var widgetWidthMargin = 5; // content offset from widget left border

    var Model = function() {
        this.nodes = null;
        this.connections = null;
        this.showInfluence = 0;
    };

    Model.prototype.initView = function(widget) {
        var m = this;
        $("input[name=mode]").change(function() {
            m.clearMode();
        });
        this.widget = widget;
        this.width = parseInt(this.widget.css("width")) - widgetWidthMargin;
        this.height = parseInt(this.widget.css("height")) - widgetHeightMargin;
        var svg = d3.select("#marvelViz");
        svg.selectAll("g").remove();
        svg.selectAll("rect").remove();
        svg.append("g").attr("class", "conns");
        this.rect = svg.append("rect").attr("fill-opacity", 0).attr("class",
            "overlay");
        svg.append("g").attr("class", "nodes");
        this.zoomListener = d3.behavior.zoom().scaleExtent([0.1, 4]).on("zoom", this.zoom);
        this.rect.call(this.zoomListener);

        // var data = this.nodes;
        // var vp = (min(data.map(getX))-30) + " " + (min(data.map(getY))-30)
        // + " " + (max(data.map(getX))+30) + " " + (max(data.map(getY))+30);
        // console.log(vp);
        // svg.attr("viewBox", vp);

        // register window resize handler
        $(window).resize(function() {
            m.fixSize();
        });
        m.fixSize();

        this.updateView();
    };

    Model.prototype.fixSize = function() {
        var svg = d3.select("#marvelViz");
        svg.attr("width", this.width);
        svg.attr("height", this.height);
        svg.select("rect.overlay").attr("width", this.width).attr("height", this.height);
    };

    Model.prototype.zoom = function() {
        var svg = d3.select("#marvelViz").selectAll(["g.nodes", "g.conns"]);
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    };

    Model.prototype.scaleToFit = function() {
        var nodeBox = d3.select("#marvelViz").select("g.conns").node().getBBox();
        var w = nodeBox.width + 400;
        var h = nodeBox.height + 160;
        var scale = Math.min(parseInt(this.width) / w, parseInt(this.height) / h);
        scale *= 0.98; // leave some margins
        if (scale <= 0 || scale >= 10000) scale = 1;
        if (transX <= -10000 || transX >= 10000) transX = 0;
        if (transY <= -10000 || transY >= 10000) transY = 0;
        var transX = (this.widget.offset().left + widgetWidthMargin - $("g.conns").offset().left + 200) * scale;
        var transY = (this.widget.offset().top + widgetHeightMargin - $("g.conns").offset().top + 80) * scale;
        this.zoomListener.translate([transX, transY]).scale(scale);
        this.zoomListener.event(this.rect);

        // var svg = d3.select("#marvelViz").selectAll([ "g.nodes", "g.conns" ]);
        // svg.attr("transform", "translate(" + [transX, transY] + ")scale("
        // 		+ scale + ")");
    };

    Model.prototype.updateView = function() {
        this.updateConnections();
        this.updateNodes();
        this.updateConnections();
        this.scaleToFit();
    };

    Model.prototype.updateNodes = function() {
        var m = this;
        var svg = d3.select("#marvelViz").select("g.nodes");

        var data = $.map(this.nodes, function(v) {
            return v;
        });
        var node = svg.selectAll("g.node").data(data);

        var group = node.enter().append("g").attr("class", "node");
        group.append("rect");
        group.append("text");
        group.on('click', function(d) {
            m.clickNode(d);
        });

        var m = this;
        node.transition().attr("opacity", function(d, i) {
            if (m.showInfluence > 0 && d.select == 0) {
                return 0.3;
            } else {
                return 1;
            }
        });

        node.select("rect").attr("y", function(d) {
                return (d.isConditional) ? d.Center._y : d.Center._y - 20;
            })
            .attr("width", function(d) {
                return (d.isConditional) ? 0 : 130;
            })
            .attr("height", function(d) {
                return (d.isConditional) ? 0 : 40;
            })
            .attr("rx", function(d) {
                return (d.isConditional) ? 0 : 8;
            })
            .attr("ry", function(d) {
                return (d.isConditional) ? 0 : 8;
            })
            .attr("style", "stroke:black;stroke-width:2")
            .attr("fill", function(d) {
                return "rgb(" + d.Background.R + "," + d.Background.G + "," + d.Background.B + ")";
            });

        node.select("text").attr("x", function(d) {
            return d.Center._x;
        }).attr("y", function(d) {
            return d.Center._y + 5;
        }).text(function(d) {
            return (d.isConditional) ? ' ' : d.Name;
        }).attr("text-anchor", "middle").attr("font-size", "20px").attr("font-weight", "bold");

        // fix width
        node.select("rect").attr("width", function(d) {
            if (d.isConditional) {
                d.calculatedWidth = 1;
            } else {
                var tw = d3.select(this.parentNode).select("text").node().getComputedTextLength();
                d.calculatedWidth = Math.max(tw + 10, 130);
            }
            return d.calculatedWidth;
        }).attr("x", function(d) {
            return (d.isConditional) ? (d.Center._x) : (d.Center._x - d.calculatedWidth / 2);
        });
        node.exit().remove();
    };

    Model.prototype.connectionColor = function(conn) {
        switch (conn.select) {
            case 2:
                return "yellow";
            case 3:
                return "orange";
            case 4:
                return "red";
            default:
                return "grey";
        }
    };

    Model.prototype.updateConnections = function() {
        var svg = d3.select("#marvelViz").select("g.conns");
        var conn = svg.selectAll("g.conn").data(this.connections);
        conn.enter().append("g").attr("class", "conn").append("path");

        var m = this;
        conn.transition().attr("opacity", function(d, i) {
            if (m.showInfluence == 0 || d.select != 0) {
                return 1;
            } else {
                return 0.3;
            }
        });

        conn.select("path").attr(
            "d",
            function(d) {
                var from = m.nodes[d.FromVariable];
                var to = m.nodes[d.ToVariable];
                var toc;
                if (to.isConditional) {
                    toc = Marvelous.boxPoint(0, 0, [to.Center._x, to.Center._y], [from.Center._x, from.Center._y]);
                } else {
                    toc = Marvelous.boxPoint(to.calculatedWidth + 8, 48, [to.Center._x, to.Center._y], [from.Center._x, from.Center._y]);
                }
                var frc = Marvelous.boxPoint(from.calculatedWidth + 2, 42, [
                    from.Center._x, from.Center._y
                ], [to.Center._x,
                    to.Center._y
                ]);
                return "M " + frc[0] + " " + frc[1] + " Q " + d.Center._x + " " + d.Center._y + " " + toc[0] + " " + toc[1];
            }).attr("stroke-width", 4).attr("fill-opacity", "0").attr("style", "marker-end:url(#markerArrow);");

        conn.select("path").transition().attr("stroke", function(d) {
            return m.connectionColor(d);
        });

        conn.exit().remove();
    };

    Model.prototype.clearMode = function() {
        for (var i in this.connections) {
            this.connections[i].select = 0;
        }
        for (var i in this.nodes) {
            this.nodes[i].select = 0;
        }
        this.showInfluence = 0;
        this.updateView();
    };

    Model.prototype.getNodesWithSelect = function(select) {
        var res = [];
        for (var i in this.nodes) {
            if (this.nodes[i].select == select) {
                res.push(this.nodes[i]);
            }
        }
        return res;
    };

    Model.prototype.getConnectionsWithSelect = function(select) {
        return this.connections.filter(function(x) {
            return x.select == select;
        });
    };

    Model.prototype.clickNode = function(d) {
        var mode = $("input[name=mode]:checked").attr('id');
        if (mode === undefined || mode == "noinfluence") {
            // Don't show influences
            this.clearMode();
        } else {
            if (this.showInfluence > 3) {
                // reset after three times
                this.clearMode();
            } else {
                if (d.select != 1) {
                    // Start a new select
                    this.clearMode();
                    d.select = 1;
                    this.showInfluence = 1;
                }
                var nodes = this.getNodesWithSelect(this.showInfluence);
                this.showInfluence++;
                var showInfluence = this.showInfluence;
                if (mode == "influences") {
                    for (var i in nodes) {
                        this.outgoingNodes(nodes[i]).forEach(function(x) {
                            x.select = showInfluence;
                        });
                        this.outgoingConnections(nodes[i]).forEach(function(x) {
                            x.select = showInfluence;
                        });
                    }
                } else { // mode == "influencedby"
                    for (var i in nodes) {
                        this.incomingNodes(nodes[i]).forEach(function(x) {
                            x.select = showInfluence;
                        });
                        this.incomingConnections(nodes[i]).forEach(function(x) {
                            x.select = showInfluence;
                        });
                    }
                }
            }
            this.updateView();
        }
    };

    Model.prototype.outgoingConnections = function(node) {
        var res = [];
        for (var i in this.connections) {
            if (this.connections[i].FromVariable == node.Id) {
                res.push(this.connections[i]);
            }
        }
        return res;
    };

    Model.prototype.outgoingNodes = function(node) {
        var m = this;
        return this.outgoingConnections(node).map(function(c) {
            return m.nodes[c.ToVariable];
        });
    };

    Model.prototype.incomingConnections = function(node) {
        var res = [];
        for (var i in this.connections) {
            if (this.connections[i].ToVariable == node.Id) {
                res.push(this.connections[i]);
            }
        }
        return res;
    };

    Model.prototype.incomingNodes = function(node) {
        var m = this;
        return this.incomingConnections(node).map(function(c) {
            return m.nodes[c.FromVariable];
        });
    };


    return {
        merge: function(arr1, arr2) {
            for (var i in arr1) {
                if ($.inArray(arr1[i], arr2) < 0) {
                    arr2.push(arr1[i]);
                }
            }
            return arr2;
        },


        // Load the overview page
        model: function(marvelModel, name, widgetElement) {
            $(".loading").show();
            var modelname = name;

            var view = $("#marvelViz");
            // var template = $($("#modelTemplate").html());
            // template.find("h1").text(name);
            // view.empty().append(template);

            // load model
            currentmodel = Marvelous.loadModel(marvelModel);
            // start visualization
            currentmodel.initView(widgetElement);
        },

        loadModel: function(marvelModel) {
            var data = JSON.parse(marvelModel);
            var model = new Model();
            // connections
            model.connections = data.GetModelResult.Connections;
            if (data.GetModelResult.ConditionalConnections) {
                data.GetModelResult.ConditionalConnections.forEach(function(c) {
                    model.connections.push(c);
                });
            }
            // initialize select field
            for (var i in model.connections) {
                model.connections[i].select = 0;
            }
            // Nodes
            model.nodes = {};
            for (var i in data.GetModelResult.Variables) {
                model.nodes[data.GetModelResult.Variables[i].Id] = data.GetModelResult.Variables[i];
            }
            if (data.GetModelResult.ConditionalVariables) {
                for (var i in data.GetModelResult.ConditionalVariables) {
                    data.GetModelResult.ConditionalVariables[i].isConditional = true;
                    model.nodes[data.GetModelResult.ConditionalVariables[i].Id] = data.GetModelResult.ConditionalVariables[i];
                }
            }
            return model;
        },

        refreshView: function(widgetElement) {
            currentmodel.initView(widgetElement);
        },

        // max = function(a) {
        // return Math.max.apply(null, a);
        // };
        //
        // min = function(a) {
        // return Math.min.apply(null, a);
        // };
        //
        // function getX(d) {
        // return d.Center._x;
        // }
        // function getY(d) {
        // return d.Center._y;
        // }

        /*
         * This file contains some helpful methods for determining where an arrow is
         * connected to a box. This is used for visualizing the model.
         *
         * I was very disappointed that I couldn't find a library that takes care of
         * this issue...
         */

        /** Calculate intersection coordinate of two lines */
        checkLineIntersection: function(line1StartX, line1StartY, line1EndX, line1EndY,
            line2StartX, line2StartY, line2EndX, line2EndY) {
            // if the lines intersect, the result contains the x and y of the
            // intersection (treating the lines as infinite) and booleans for whether
            // line segment 1 or line segment 2 contain the point
            var denominator, a, b, numerator1, numerator2, result = {
                x: null,
                y: null,
                onLine1: false,
                onLine2: false
            };
            denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
            if (denominator == 0) {
                return result;
            }
            a = line1StartY - line2StartY;
            b = line1StartX - line2StartX;
            numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
            numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
            a = numerator1 / denominator;
            b = numerator2 / denominator;

            // if we cast these lines infinitely in both directions, they intersect
            // here:
            result.x = line1StartX + (a * (line1EndX - line1StartX));
            result.y = line1StartY + (a * (line1EndY - line1StartY));
            /*
             * // it is worth noting that this should be the same as: x = line2StartX +
             * (b * (line2EndX - line2StartX)); y = line2StartX + (b * (line2EndY -
             * line2StartY));
             */
            // if line1 is a segment and line2 is infinite, they intersect if:
            if (a > 0 && a < 1) {
                result.onLine1 = true;
            }
            // if line2 is a segment and line1 is infinite, they intersect if:
            if (b > 0 && b < 1) {
                result.onLine2 = true;
            }
            // if line1 and line2 are segments, they intersect if both of the above are
            // true
            return result;
        },

        /** Helper method */
        intersect: function(l1s, l1e, l2s, l2e) {
            return Marvelous.checkLineIntersection(l1s[0], l1s[1], l1e[0], l1e[1], l2s[0],
                l2s[1], l2e[0], l2e[1]);
        },

        /**
         * Calculate the coordinates of the intersection of a line with a box with a
         * given height and width when the beginning of the line is the center of the
         * box
         *
         * @param w
         *            width of box in px
         * @param h
         *            height of box in px
         * @param b
         *            [x,y] of begin of line (and center of the box)
         * @param e
         *            [x,y] of end of line
         * @returns [x,y] of connection point
         */
        boxPoint: function(w, h, b, e) {
            var lt = [b[0] - w / 2, b[1] - h / 2];
            var rt = [b[0] + w / 2, b[1] - h / 2];
            var lb = [b[0] - w / 2, b[1] + h / 2];
            var rb = [b[0] + w / 2, b[1] + h / 2];
            var v;
            v = Marvelous.intersect(lt, rt, b, e);
            if (v.onLine1 && v.onLine2) {
                return [v.x, v.y];
            }
            v = Marvelous.intersect(rt, rb, b, e);
            if (v.onLine1 && v.onLine2) {
                return [v.x, v.y];
            }
            v = Marvelous.intersect(rb, lb, b, e);
            if (v.onLine1 && v.onLine2) {
                return [v.x, v.y];
            }
            v = Marvelous.intersect(lb, lt, b, e);
            if (v.onLine1 && v.onLine2) {
                return [v.x, v.y];
            }
            return b;
        }
    };
})();
