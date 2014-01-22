Controller = {};


// ************************** Deals with querying wikipedia for a 
// * Result List Controller * concept and rendering the result list 
// ************************** of the context in a google like fashion.

Controller["DialHome"] = {
  log_LORE: function(session, links, concepts) {
    $.when(Api.wikipediaservices.log_LORE(session, links, concepts))
    .then(function() {
      console.log("dial home: logged current state of LORE!");
    });
  },
  log_query: function(session, query) {
    $.when(Api.wikipediaservices.log_query(session, query))
    .then(function() {
      console.log("dial home: logged current query "+query+"!");
    });
  }
};


// ************************** Deals with querying wikipedia for a 
// * Result List Controller * concept and rendering the result list 
// ************************** of the context in a google like fashion.

Controller["ResultList"] = {
  render_query: function(event) {
    if(event) event.preventDefault();
    
    LORE.forget_new_links();
    
    $("div#lore-snippets").hide();
    
    var input_query = $("input#query").val();
    
    View["ResultList"].clear();
    
    var query = null;
    if(input_query) {
      query = input_query;
    } else {
      query = $.querystring["query"];
    }
    if(query && query != null) {
      $("input#query").val(query);                // enter query into search field
      var session = $.querystring["session_id"];
      Controller["DialHome"].log_query(session, query);
      $("ol#recent-queries").prepend("<li>");
      $("ol#recent-queries li:first-of-type").append("<a href='#' onclick=\"LORE.search_for('"+query+"');\">");
      $("ol#recent-queries li:first-of-type a").text(query);
      
      var miner = Api.wikipediaminer;
      $.when(miner.connected()).then(function() {
        console.log("connected to wikipedia miner");
        
        Controller.ResultList.forQuery(query);
        
        LORE.render(LORE.links, LORE.concepts);
      });
    } else {
      LORE.render(LORE.links, LORE.concepts);
    }
  },
  forQuery: function(query) {
    //console.log("ResultList.forQuery("+query+")");
    
    var num_of_results = Config["ResultList"].num_of_results;
    
    if(query) {
      $.when(Api.wikipedia.search(query, num_of_results))
      .then(get_meta_data_array, else_log_error)
      .then(get_pageids, else_log_error)
      .then(Api.wikipediaservices.articles_by_pageids, else_log_error)
      .then(get_five_or_less, else_log_error)
      .then(function(articles) { return get_meta_data_array({query: {search: articles}}) }, else_log_error)
      .then(render_titles_and_urls, else_log_error)
      .then(get_pageids, else_log_error)
      .then(render_results_count, else_log_error)
      .then(function(pageids) { //console.log("anonymous");
        if(!pageids) { console.error("!pageids");
          return Future();
        }
        
      //var s = Api.wikipediaservices.summaries;
      //return $.when(s(pageids[0]), s(pageids[1]), s(pageids[2]), s(pageids[3]), s(pageids[4]))
        
        var deferred_summaries = $.map(pageids, function(pageid) {
          return Api.wikipediaservices.summaries(pageid);
        });
        
        return $.when.apply($, deferred_summaries)
        .then(function(summary0, summary1, summaryN) { //console.log("arguments"); console.log(arguments); console.log(arguments.length);
          var the_arguments = arguments;
          console.log("the_arguments"); console.log(the_arguments); console.log(the_arguments.length);
          
          return $.when(get_concept_summaries(pageids)(the_arguments))
          .then(LORE.wikify_all)
          .then(render_summaries_in_result_list(pageids))
          .then(function(pageids, summaries) { //console.log("anonymous: pageids, summaries");
            return $.when(Api.wikipediaservices.articles_by_pageids(pageids), Future(summaries));
          })
          .then(function(articles, summaries) { //console.log("articles"); console.log(articles); console.log("summaries"); console.log(summaries);
            if(articles.length > 0) articles = articles[0];
            articles = articles ? articles.elems : [];
            
            var titles_by_ids = {};
            $.each(articles, function(index, article) {
              titles_by_ids[article.id] = article.title;
            }); //console.log("titles_by_ids"); console.log(titles_by_ids);
            
            
            // also add summaries to LORE.concepts
            $.each(pageids, function(index, pageid) {
              var summary = summaries[index]; //console.log("summary: "+summary);
              if(!summary) summary = "no snippet available";
              summary = LORE.add_html_links(summary);
              var concept = titles_by_ids[pageid]; //console.log("concept: "+concept)
              var lower = concept.toLowerCase();
              if(lower) {
                if(!LORE.concepts[lower]) LORE.concepts[lower] = summary;
              }
            });
            
            var summaries_objects = the_arguments; //console.log("summaries"); console.log(summaries);
            return render_LORE(summaries_objects, titles_by_ids);
          });        
        });
      })
      .done(function(done) {
        console.log("done"); console.log(done);
      });
    } else console.error("no query given for ResultList");
    
    function else_log_error(error) { console.error(error); }
    
    function get_meta_data_array(json) { //console.log("get_meta_data_array"); console.log("json"); console.log(json);
      var pages = json.query.search;
      
      if(!pages) {
        console.error("!pages")
        return Future();
      }
      
      var titles = $.map(pages, function(page) { return page.title; }); //console.log("titles"); console.log(titles); console.log(titles.length);
      
      return $.when(Api.wikipedia.info(titles))
      .then(get_meta_data);
              
      function get_meta_data(meta_data_object) { //console.log("get_meta_data"); //console.log("meta_data_object"); console.log(meta_data_object);
        if(!meta_data_object) { console.error("!meta_data_object");
          return Future();
        }
        
        var query = meta_data_object.query
        if(!query) { console.error("!query");
          return Future();
        }
        
        var pages_obj = query.pages;
        if(!pages_obj) { console.error("!pages_obj");
          return Future();
        }
        
        var pages = $.map(meta_data_object.query.pages, function(page) { return page; });
        var meta_data_array = $.map(titles, function(title) {
          return $.grep(pages, function(page) { return page.title == title; });
        }); //console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
        return Future(meta_data_array);
      }
    }
    
    function get_pageids(meta_data_array) { //console.log("get_pageids"); console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
      if(!meta_data_array) {
        console.error("!meta_data_array");
        return Future();
      }
      var pageids = $.map(meta_data_array, function(meta_data) { return meta_data.pageid; }); //console.log("pageids"); console.log(pageids); console.log(pageids.length);
      return Future(pageids);
    }
    
    function get_five_or_less(articles) { //console.log("get_five_or_less"); console.log("articles"); console.log(articles);
      if(!articles) {
        console.error("!articles")
        return Future();
      }
      
      var elems = articles.elems;
      
      var reverse = [];
      if(elems) {
        for(var j = elems.length - 1; j >= 0; j--) {
          reverse.push(elems[j]);
        }
      }
      
      var five_or_less = [];
      for(var i = 0; i < num_of_results; i++) {
        var pageid = reverse[i];
        if(pageid) {
          five_or_less.push(pageid);
        }
      } //console.log("five_or_less"); console.log(five_or_less); console.log(five_or_less.length);
      
      return Future(five_or_less);
    }
    
    function render_titles_and_urls(meta_data_array) { //console.log("render_titles_and_urls"); console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
      if(!meta_data_array) {
        console.error("!meta_data_array");
        return Future();
      }
      
      $.each(meta_data_array, function(index, meta_data) {
        View.ResultList.append_item(meta_data.pageid, meta_data.title, meta_data.fullurl)
      });
      
      return Future(meta_data_array);
    }
    
    function render_results_count(pageids) { //console.log("render_results_count"); console.log("pageids"); console.log(pageids); console.log(pageids.length);
      if(!pageids) { console.error("!pageids");
        return Future();
      }
      View.Count.set(pageids.length);
      return Future(pageids);
    }
    
    
    function get_concept_summaries(pageids) {
      return function(args) { //console.log("get_concept_summaries"); console.log("args"); console.log(args); console.log(args.length);
        var summaries = $.map(args, function(argument) {
          return LORE.choose_summary(argument)[0];
        });
        
        return Future(summaries);
      }
    }
    
    function render_summaries_in_result_list(pageids) {
      return function(summaries) { //console.log("render_summaries_in_result_list"); console.log(summaries); console.log(summaries.length);
        $.each(summaries, function(index, summary) {
          View.ResultList.append_snippet(pageids[index], summary);
        });
        return $.when(Future(pageids), Future(summaries));
      };
    }
    
    function render_LORE(summaries, titles_by_ids) { //console.log("render_LORE");
      LORE.insert(summaries, titles_by_ids);
      return Future(summaries);
    }
    
  }
};