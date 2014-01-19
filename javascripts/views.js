// Views render data into the DOM.
View = {};


// ********************
// * Result List View *
// ********************

View["ResultList"] = {
  clear: function() {
    $("ol#ranked-list > li").remove();
    View["Count"].set("0");
  },
  append_item: function(pageid, title, url) {
    var li = d3.select("ol#ranked-list").append("li")
      , h3 = li.append("h3");
    li.attr("id", "result-"+pageid);
    h3.append("a").attr("href", "#").attr("onclick", "LORE.search_for('"+title+"')").text(title);
    li.append("h4").text(url);
    li.append("p").style("background", "url(images/ajax-loader.gif) no-repeat");
  },
  append_snippet: function(pageid, snippet) {
    if(snippet) {
    //var fixed_markup = snippet.replace(/\[\[\[\[/g, "[[");
    //var with_links = fixed_markup.replace(/\[\[([^\|]+)\|([^\]]+)\]\]/g, function(m, href, title) {
    //  var words = title.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
    //  var char_match = /^.*[\|\&;\$%@"<>\(\)\{\}\[\]\+\\=_;]+.*$/g;
    //  var has_chars = title.match(char_match);
    //  if(has_chars || words.length > 5) return m;
    //  else return '<a href="http://en.wikipedia.org/wiki/'+href+'">'+title+"</a>";
    //});
    //with_links = with_links.replace(/\[\[([^\]]+)\]\]/g, function(m, title) {
    //  var words = title.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
    //  var char_match = /^.*[\|\&;\$%@"<>\(\)\{\}\[\]\+\\=_;]+.*$/g;
    //  var has_chars = title.match(char_match);
    //  if(has_chars || words.length > 5) return m;
    //  else return '<a href="http://en.wikipedia.org/wiki/'+title+'">'+title+"</a>";
    //});
    //var less_markup = with_links.replace(/[\[\|\]]/g, "");
      
      var less_markup = LORE.add_html_links(snippet); //console.log("I added some markup!")
      d3.select("li#result-"+pageid+">p").style("background", "none").html(less_markup);
    }
  }
};


// **************
// * Count View *
// **************

View["Count"] = {
  set: function(count) {
    $("#search-results .count").text(count);
  }
}