Controller = {};


// ************************** Deals with querying wikipedia for a 
// * Result List Controller * concept and rendering the result list 
// ************************** of the context in a google like fashion.

Controller["ResultList"] = {
  forQuery: function(query) {
    console.log("ResultList.forQuery("+query+")");
    
    if(query) {
      $.when(Api.wikipedia.search(query, 10))
      .then(get_meta_data_array, else_log_error)
      .then(get_pageids, else_log_error)
      .then(Api.wikipediaservices.articles_by_pageids, else_log_error)
      .then(get_five_or_less, else_log_error)
      .then(function(articles) { return get_meta_data_array({query: {search: articles}}) }, else_log_error)
      .then(render_titles_and_urls, else_log_error)
      .then(get_pageids, else_log_error)
      .then(render_results_count, else_log_error)
      .then(function(pageids) { console.log("anonymous");
        if(!pageids) { console.error("!pageids");
          return Future();
        }
        
        var s = Api.wikipediaservices.summaries;
        return $.when(s(pageids[0]), s(pageids[1]), s(pageids[2]), s(pageids[3]), s(pageids[4]))
        .then(function(summary0, summary1, summaryN) { console.log("arguments"); console.log(arguments); console.log(arguments.length);
          var the_arguments = arguments;
          
          
  //      console.log("first $.when");
  //      var first_when = $.when(get_concept_summaries(pageids)(the_arguments))
  //    //.then(LORE.wikify)
  //      .then(wikify_all)
  //      .then(render_summaries_in_result_list(pageids));
  //      
  //      console.log("second $.when");
  //      var second_when = $.when(Future(the_arguments), Api.wikipediaservices.articles_by_pageids(pageids))
  //      .then(function(summaries, articles) { console.log("second $.when - summaries"); console.log(summaries);//console.log(summaries.length);
  //        articles = articles[0] ? articles[0].elems : [];
  //        var summaries = the_arguments;
  //        
  //        var titles_by_ids = {};
  //        $.each(articles, function(index, article) {
  //          titles_by_ids[article.id] = article.title;
  //        }); console.log("second $.when - titles_by_ids"); console.log(titles_by_ids);
  //        
  //        return render_LORE(summaries, titles_by_ids);
  //      });
  //      
  //      return $.when(first_when, second_when);
          
          
          return $.when(get_concept_summaries(pageids)(the_arguments))
          .then(wikify_all)
          .then(render_summaries_in_result_list(pageids))
          .then(Api.wikipediaservices.articles_by_pageids)
          .then(function(articles) { console.log("articles"); console.log(articles);
            articles = articles ? articles.elems : [];
            var summaries = the_arguments; console.log("summaries"); console.log(summaries);
            
            var titles_by_ids = {};
            $.each(articles, function(index, article) {
              titles_by_ids[article.id] = article.title;
            }); console.log("titles_by_ids"); console.log(titles_by_ids);
            
            return render_LORE(summaries, titles_by_ids);
          });        
        });
      })
      .done(function(done) { console.log("done");
        console.log("done"); console.log(done);
      });
    } else console.error("no query given for ResultList");
    
    function else_log_error(error) { console.error(error); }
    
    function get_meta_data_array(json) { console.log("get_meta_data_array");
      var pages = json.query.search;
      
      if(!pages) {
        console.error("!pages")
        return Future();
      }
      
      var titles = $.map(pages, function(page) { return page.title; }); console.log("titles"); console.log(titles); console.log(titles.length);
      
      return $.when(Api.wikipedia.info(titles))
      .then(get_meta_data);
              
      function get_meta_data(meta_data_object) { console.log("get_meta_data"); console.log("meta_data_object"); console.log(meta_data_object);
        if(!meta_data_object) {console.error("!meta_data_object");
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
        }); console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
        return Future(meta_data_array);
      }
    }
    
    function get_pageids(meta_data_array) { console.log("get_pageids"); console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
      if(!meta_data_array) {
        console.error("!meta_data_array");
        return Future();
      }
      var pageids = $.map(meta_data_array, function(meta_data) { return meta_data.pageid; }); console.log("pageids"); console.log(pageids); console.log(pageids.length);
      return Future(pageids);
    }
    
    function get_five_or_less(articles) { console.log("get_five_or_less"); console.log("articles"); console.log(articles);
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
      for(var i = 0; i < 5; i++) {
        var pageid = reverse[i];
        if(pageid) {
          five_or_less.push(pageid);
        }
      } console.log("five_or_less"); console.log(five_or_less); console.log(five_or_less.length);
      
      return Future(five_or_less);
    }
    
    function render_titles_and_urls(meta_data_array) { console.log("render_titles_and_urls"); console.log("meta_data_array"); console.log(meta_data_array); console.log(meta_data_array.length);
      if(!meta_data_array) {
        console.error("!meta_data_array");
        return Future();
      }
      
      $.each(meta_data_array, function(index, meta_data) {
        View.ResultList.append_item(meta_data.pageid, meta_data.title, meta_data.fullurl)
      });
      
      return Future(meta_data_array);
    }
    
    function render_results_count(pageids) { console.log("render_results_count"); console.log("pageids"); console.log(pageids); console.log(pageids.length);
      if(!pageids) { console.error("!pageids");
        return Future();
      }
      View.Count.set(pageids.length);
      return Future(pageids);
    }
    
    
    function get_concept_summaries(pageids) {
      return function(args) { console.log("get_concept_summaries"); console.log("args"); console.log(args); console.log(args.length);
        var summaries = $.map(args, function(argument) {
          return LORE.choose_summary(argument)[0];
        });
        
        return Future(summaries);
      }
    }
    
    function wikify_all(summaries) { console.log("wikify_all"); console.log("summaries"); console.log(summaries);
      var dfd = new $.Deferred();
      
      var texts = $.map(summaries, function(summary) { return summary.text; }); console.log("texts"); console.log(texts); console.log(texts.length);
      var deferreds = $.map(texts, function(text) {
        return Api.wikipediaminer.wikify(text, 0.5);
      });
      $.when.apply($, deferreds)
      .then(function() { // strange: it returns [Object, Array, Array, ..., Array]
        var wikifieds = arguments; console.log("arguments"); console.log(arguments); console.log(arguments.length);
        if(!wikifieds) wikifieds = [];
        var summs = $.map(wikifieds, function(wikified, index) {
          var wikifiedDocument = wikified.wikifiedDocument;
          if(!wikifiedDocument) {
            if(wikified.length == 3) {
              var first = wikified[0];
              if(first) first.wikifiedDocument;
            }
            if(!wikifiedDocument) {
              var text = texts[index];
              if(text) wikifiedDocument = text;
            }
            if(!wikifiedDocument) wikifiedDocument = "";
          }
          return wikifiedDocument;
        }); console.log("wikified summaries"); console.log("summs"); console.log(summs);
        dfd.resolve(summs);
      });
      
      return dfd.promise();
      
    //var texts = $.map(summaries, function(summary) { return summary.text; });
    //var concatenated_texts = texts.join("$$$$$");
    //return $.when(Api.wikipediaminer.wikify(concatenated_texts, 0.5))
    //.then(function(wikified) { console.log("anonymous"); console.log("wikified"); console.log(wikified);
    //  var wikified_doc = wikified.wikifiedDocument;
    //  if(!wikified_doc) wikified_doc = "";
    //  var parts = wikified_doc.split("$$$$$");
    //  return Future(parts);
    //});
    }
    
    function render_summaries_in_result_list(pageids) {
      
      return function(summaries) { console.log("render_summaries_in_result_list"); console.log(summaries); console.log(summaries.length);
        $.each(summaries, function(index, summary) {
          View.ResultList.append_snippet(pageids[index], summary);
        });
        return Future(pageids);
      };
      
  //  return function(wikified1, wikified2, wikifiedN) { console.log("render_summaries_in_result_list"); console.log("arguments"); console.log(arguments); console.log(arguments.length);
  //    
  //    console.log("fooooooooooooooooooooooooooooooooooooooooooo")
  //    
  //    var summaries = $.map(arguments, function(argument) {
  //      return argument[0].wikifiedDocument;
  //    }); console.log("summaries"); console.log(summaries); console.log(summaries.length);
  //    
  //    $.each(summaries, function(index, summary) {
  //      View.ResultList.append_snippet(pageids[index], summary);
  //    });
  //    return Future(pageids);
  //  };
    }
    
    function render_LORE(summaries, titles_by_ids) { console.log("render_LORE");
      LORE.insert(summaries, titles_by_ids);
      return Future(summaries);
    }
    
  }
};