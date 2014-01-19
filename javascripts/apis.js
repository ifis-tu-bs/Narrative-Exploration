Api = {};


// *************
// * Wikipedia *
// *************

Api["wikipedia"] = {
  url: Config.Api.wikipedia.url,
  cache: {},
  service: function(service) {
    var url = Api.wikipedia.url
      , cache = Api.wikipedia.cache;
    return cachedAjaxP(url, cache, service+"&format=json");
  },
  search: function(query, lim) {
    var service = Api.wikipedia.service
      , limit = lim || 10;
          
  //return service("?action=query&prop=info&inprop=url&generator=search&gsrsearch="+query+"&gsrlimit="+limit);
    return service("?action=query&list=search&srsearch="+query+"&srprop=&srlimit="+limit)
  },
  info: function(titls) { // example: http://en.wikipedia.org/w/api.php?action=query&prop=info&&inprop=url&titles=NLP|Data Mining
    var service = Api.wikipedia.service
      , titles = titls || [];
    return service("?action=query&prop=info&&inprop=url&titles="+titles.join("|"));
  }
};


// *******************
// * Wikipedia Miner *
// *******************

Api["wikipediaminer"] = {
  url: Config.Api.wikipediaminer.url,
  cache: {},
  service: function(service) {
    var url = Api.wikipediaminer.url
      , cache = Api.wikipediaminer.cache;
    return cachedAjax(url, cache, service+"&responseFormat=JSON");
  },
  connected: function() {
    return Api.wikipediaminer.service("getProgress?");
  },
  wikify: function(text, min_probability) { //console.log("Api.wikipediaminer.wikify"); console.log("text"); console.log(text);
  //if(!min_probability) min_probability = 0.5;
  //return Api.wikipediaminer.service("wikify?minProbability="+min_probability+"&sourceMode=wiki&source="+text);
    
    if(!min_probability) min_probability = 0.5;
    var dfd = new $.Deferred();
    
    $.when(Api.wikipediaminer.service("wikify?minProbability="+min_probability+"&sourceMode=wiki&source="+text))
    .then(dfd.resolve);
    
    setTimeout(function() {
      dfd.resolve({ wikifiedDocument: text });
    }, 2000);
    
    return dfd.promise();
  },
  compare_ids: function(ids1, ids2) {
    var concat_ids1 = ids1.join(",");
    var concat_ids2 = ids2.join(",");
    return Api.wikipediaminer.service("compare?ids1="+concat_ids1+"&ids2="+concat_ids2);
  }
};


// **********************
// * Wikipedia Services *
// **********************

Api["wikipediaservices"] = {
  url: Config.Api.wikipediaservices.url,
  cache: {},
  service: function(service, type, data) {
    var url = Api.wikipediaservices.url
      , cache = Api.wikipediaservices.cache;
    return cachedAjax(url, cache, service, type, data);
  },
  POST_service: function(service, data) {
    var url = Api.wikipediaservices.url;
    return $.ajax(url+service, { dataType: 'json', type: 'POST', data: data });
  },
  log_LORE: function(session, links, concepts) { //console.log("log_LORE")
    var json = {
      "session": session,
      "links": links,
      "concepts": concepts
    };
  //var json_string = JSON.stringify(json);
    return Api.wikipediaservices.POST_service("log/lore", json);
  },
  log_query: function(session, query) { //console.log("log_query")
    var json = {
      "session": session,
      "query": query
    };
  //var json_string = JSON.stringify(json);
    return Api.wikipediaservices.POST_service("log/query", json);
  },
  articles_by_pageids: function(pageids) { //console.log("articles_by_pageids");
    if(!pageids) {
      console.error("!pageids")
      return Future();
    }
    if(pageids.length == 0) return Future();
    var service = Api.wikipediaservices.service;
    var ids = pageids.join("&id="); //console.log("article/list?id="+ids);
    return service("article/list?id="+ids);
  },
  summaries: function(pageid) { //console.log("Api.wikipediaservices.summaries");
    if(pageid) { //console.log("if"); console.log(pageid);
      var service = Api.wikipediaservices.service;

      return $.when(service("summary/article?id="+pageid))
      .then(function(json) {
        var summary = {
          "pageid": pageid,
          "summaries": (function() {
            var definition = $.grep(json.elems, function(elem) { return elem._1.id == 0; });
            if(definition[0]) {
              return definition[0]._2.elems;
            } else {
              return [];
            }
          }()),
          "aspects": (function() {
            var aspects = $.grep(json.elems, function(elem) { return elem._1.id != 0; });
            var aspect_summaries = $.map(aspects, function(aspect) {
              return {
                "title": aspect._1.title,
                "summaries": aspect._2.elems
              };
            });
            return aspect_summaries;
          }())
        }; //console.log("summary"); console.log(summary);
        
        return Future(summary);
      });
    } else { //console.log("else");
      return Future({ "pageid": -1, "summaries": [], "aspects": [] });
    }
  }
};


// *********************
// * Utility functions *
// *********************

function cachedAjax(url, cache, service, type, data) {
  /*if(!type) type = 'GET';
  if(!data) data = {};*/
  var promise = cache[service];
  if(!promise) {
    promise = $.ajax(url+service, { dataType: 'json'/*, type: type, data: data*/ });
    cache[service] = promise;
  }
  return promise;
}

function cachedAjaxP(url, cache, service, type, data) {
  /*if(!type) type = 'GET';
  if(!data) data = {};*/
  var promise = cache[service];
  if(!promise) {
    promise = $.ajax(url+service, { dataType: 'jsonp'/*, type: type, data: data*/ });
    cache[service] = promise;
  }
  return promise;
}