// ********************************
// * Datastructure for LORE graph *
// ********************************

LORE = {
  insert: function(summaries, titles_by_ids) { //console.log("LORE.insert")
  //console.log("summaries"); //console.log(summaries)
  //console.log("titles_by_ids"); //console.log(titles_by_ids)
    
    for(var index = 0; index < summaries.length; index++) {
      var concept = summaries[index];                     //console.log("\n\n"); console.log("concept"); console.log(concept);
      var concept_page_id = concept.pageid;               //console.log("pageid: "+concept_page_id);
      var concept_title = titles_by_ids[concept.pageid];  //console.log("concept_title: "+concept_title);
      
    //if(!LORE.concepts[concept_title.toLowerCase()]) {
    //  var chosen_summaries = LORE.choose_summary(concept);
    //  if(chosen_summaries[0]) {
    //    var text = chosen_summaries[0].text;
    //    if(text) LORE.concepts[concept_title.toLowerCase()] = text;
    //  }
    //} console.log("LORE.concepts"); console.log(LORE.concepts);
      
      // config
      var min_relatedness = Config["LORE"].min_relatedness;
      var num_of_summaries = Config["LORE"].num_of_summaries;
      var min_wikify_relatedness = Config["LORE"].min_wikify_relatedness;
      
      // get `num_of_summaries` summaries for each aspect
      var all_summaries = $.map(concept.aspects, function(aspect) {
        return $.map(LORE.choose_summary(aspect, num_of_summaries), function(summary) { return summary.text; });
      });
      all_summaries = $.map(all_summaries, function(n) { return n; }); //console.log("all_summaries ("+concept_title+")"); console.log(all_summaries); console.log(all_summaries.length);
      
      // put all names twice (to have the same ids as all_summaries...)
      var all_names_twice = $.map(concept.aspects, function(aspect) {
        var titles = [];
        for(var i = 0; i < num_of_summaries; i++) {
          titles.push(aspect.title);
        }
        return titles;
      });
      all_names_twice = $.map(all_names_twice, function(n) { return n; }); //console.log("all_names_twice ("+concept_title+")"); console.log(all_names_twice); console.log(all_names_twice.length);
      
      // wikify all texts
      var as_texts = $.map(all_summaries, function(summary) { return { text: summary }; }); //console.log("as_texts ("+concept_title+")"); console.log(as_texts); console.log(as_texts.length);
      $.when(LORE.wikify_all(as_texts, min_wikify_relatedness), Future(concept_page_id), Future(concept_title), Future(all_summaries), Future(all_names_twice))
      .then(function(wikifieds, concept_page_id, local_concept_title, all_summaries, all_names_twice) { //console.log("wikifieds"); console.log(wikifieds); console.log(wikifieds.length);
        var with_html_links = $.map(wikifieds, LORE.add_html_links); //console.log("with_html_links ("+local_concept_title+")"); console.log(with_html_links); console.log(with_html_links.length);
        
        // get all concepts that appear in a summary
        var concepts_by_summary = $.map(with_html_links, function(summary) {
          var matches = summary.match(/data-concept\=["']{1}([^"']+)["']+/g);
          if(matches == null) matches = [];
          var concepts = $.map(matches, function(m) {
            return m.replace(/data-concept\=/, "").replace(/["']+/g, "");
          });
          return [ concepts ];
        }); console.log("concepts_by_summary ("+local_concept_title+")"); console.log(concepts_by_summary);// console.log(concepts_by_summary.length);
        
        // flatten titles to concat them and get ids through info
        var flattened_titles = $.map(concepts_by_summary, function(c) { return c; }); //console.log("flattened_titles ("+local_concept_title+")"); console.log(flattened_titles);
        
        // get pageids for the titles
        $.when(Api.wikipedia.info(flattened_titles))
        .then(function(response) { //console.log("response ("+local_concept_title+")"); console.log(response);
          if(response && response.query && response.query.pages) {
            
            var pages = response.query.pages;
            var pageids = $.map(pages, function(page) {
              var pageid = page.pageid;
              if(!pageid) pageid = -1;
              return pageid;
            }); //console.log("pageids"); console.log(pageids); console.log(pageids.length);

            // Get only titles that are also in wikipediaservices (and thus have summaries)
            $.when(Api.wikipediaservices.articles_by_pageids(pageids))
            .then(function(articles) { //console.log("articles"); console.log(articles);
              articles = articles.elems;
              var title_to_pageid = {};
              $.each(articles, function(ieiece, article) {
                var article_title = article.title.toLowerCase();
                var pageid = article.id;
                title_to_pageid[article_title] = pageid;
              }); //console.log("title_to_pageid ("+local_concept_title+")"); console.log(title_to_pageid);

              var pageid_to_title = {};
              $.each(title_to_pageid, function(a_title, pageid) {
                pageid_to_title[pageid] = a_title;
              }); //console.log("pageid_to_title"); console.log(pageid_to_title);

              // now we have _valid concepts_ that appeared in a summary.

              // Remove all concepts that are not valid
              var valid_concepts_by_summary = $.map(concepts_by_summary, function(concepts) {
                var valid_concepts = $.map(concepts, function(concept) {
                  var lower = concept.toLowerCase();
                  if(lower) {
                    var pageid = title_to_pageid[lower];
                    if(pageid) return concept;
                  }
                });
                return [valid_concepts];
              }); //console.log("valid_concepts_by_summary ("+local_concept_title+")"); console.log(valid_concepts_by_summary); console.log(valid_concepts_by_summary.length);

          
          // BEGIN not the best but valid
          //  var valid_pageids_by_summary = $.map(valid_concepts_by_summary, function(concepts) {
          //    var valid_pageids = $.map(concepts, function(concept) {
          //      return title_to_pageid[concept.toLowerCase()];
          //    });
          //    return [valid_pageids];
          //  }); console.log("valid_pageids_by_summary ("+local_concept_title+")"); console.log(valid_pageids_by_summary); console.log(valid_pageids_by_summary.length);
          //
          //  var all_valid_pageids = $.map(valid_pageids_by_summary, function(pis) { return pis; }); console.log("all_valid_pageids ("+local_concept_title+")"); console.log(all_valid_pageids); console.log(all_valid_pageids.length)
          //  
          //  // Now get relatedness measures for the concepts!
          //  $.when(Api.wikipediaminer.compare_ids([concept_page_id], all_valid_pageids))
          //  .then(function(response) { //console.log("response"); console.log(response);
          //    var comparisons = response.comparisons;
          //    if(!comparisons) comparisons = []; console.log("comparisons ("+local_concept_title+")"); console.log(comparisons); console.log(comparisons.length);
          //
          //    // sort pageids by relatedness with highest first
          //    var sorted_comparisons = comparisons.sort(function(a, b) {
          //      return b.relatedness - a.relatedness;
          //    }); console.log("sorted_comparisons ("+local_concept_title+")"); console.log(sorted_comparisons); console.log(sorted_comparisons.length);
          //
          //    var best_pageids = $.map(sorted_comparisons, function(comp) {
          //      if(comp.relatedness >= min_relatedness) return comp.lowId.toString();
          //    }); console.log("best_pageids ("+local_concept_title+")"); console.log(best_pageids); console.log(best_pageids.length);
          //
          //    var best_pageids_by_summary = $.map(valid_pageids_by_summary, function(pageids) {
          //      var pids = $.map(pageids, function(pageid) {
          //        if(best_pageids.indexOf(pageid) > -1) return pageid;
          //        else console.log("not in best_pageids: "+pageid+" => ["+best_pageids.join(",")+"]")
          //      });
          //      return [pids];
          //    }); console.log("best_pageids_by_summary ("+local_concept_title+")"); console.log(best_pageids_by_summary); console.log(best_pageids_by_summary.length);
          //    
          //    var best_concepts_by_summary = $.map(best_pageids_by_summary, function(pageids) {
          //      var best = $.map(pageids, function(pageid) {
          //        return pageid_to_title[pageid];
          //      });
          //      return [best];
          //    }); console.log("best_concepts_by_summary ("+local_concept_title+")"); console.log(best_concepts_by_summary); console.log(best_concepts_by_summary.length)
          //
          //    // Now we have the most fitting concepts for each summary. We can build links!
          // END not the best but valid


              // BEGIN not the best but valid
              // var links = [];
              //$.each(best_concepts_by_summary, function(cs_index, concepts) {
              //  if(concepts.length > 0) {
              //    var summary = with_html_links[cs_index];
              //    var aspect = all_names_twice[cs_index];
              //    $.each(concepts, function(c_index, concept) {
              //      var link = {source:local_concept_title.toLowerCase(),target:concept.toLowerCase(),is_new:true,aspect:aspect.toLowerCase(),text:summary};
              //      links.push(link);
              //    });
              //  }
              //}); console.log("links ("+local_concept_title+")"); console.log(links); console.log(links.length);
              //
              //// push links
              //$.each(links, function(ind, link) {
              //  LORE.links.push(link);
              //});
              //
              //LORE.render();
              // END not the best but valid
              
                // build links
                var links = [];
              
                $.each(valid_concepts_by_summary, function(cs_index, concepts) {
                  if(concepts.length > 0) {
                    var summary = with_html_links[cs_index];
                    var aspect = all_names_twice[cs_index];
                    $.each(concepts, function(c_index, concept) {
                      var lower = concept.toLowerCase();
                      if(lower) {
                        var link = {source:local_concept_title.toLowerCase(),target:lower,is_new:true,aspect:aspect.toLowerCase(),text:summary};
                        links.push(link);
                      }
                    });
                  }
                }); //console.log("links ("+local_concept_title+")"); console.log(links); console.log(links.length);

                // push links
                $.each(links, function(ind, link) {
                  LORE.links.push(link);
                });

              //LORE.render(LORE.links, LORE.concepts);
                LORE.render();
          
          // BEGIN not the best but valid
          //  });
          // END not the best but valid
            });
            
          }
        });
      });
    }
  },
  concepts: {
  //  "htc": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Amazon": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Apple": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Barnes & Noble": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Foxconn": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Google": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  //, "inventec": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Kodak": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "LG": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Nokia": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Motorola": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Oracle": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "ZTE": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Samsung": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "RIM": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Qualcomm": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Huawei": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Ericsson": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
//, "Sony": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  //, "microsoft": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  contains_snippet_for: function(node_name) {
    var has_node = false;
    $.each(LORE.concepts, function(index, concept) {
      if(concept.node == node_name) has_node = true;
    });
    return has_node;
  },
  links: [
  //  { source: "Microsoft", target: "HTC",            is_new: true,  aspect: "1", text: "M$ -> HTC"   }
//, { source: "Microsoft", target: "Amazon",         is_new: true,  aspect: "0", text: "M$ -> Ama"   }
//, { source: "Samsung",   target: "Apple",          is_new: false, aspect: "2", text: "Sam -> App"  }
//, { source: "Motorola",  target: "Apple",          is_new: false, aspect: "3", text: "Mot -> App"  }
//, { source: "Nokia",     target: "Apple",          is_new: false, aspect: "4", text: "Nok -> App"  }
//, { source: "HTC",       target: "Apple",          is_new: false, aspect: "5", text: "HTC -> App"  }
//, { source: "Kodak",     target: "Apple",          is_new: false, aspect: "6", text: "Kod -> App"  }
//, { source: "Microsoft", target: "Barnes & Noble", is_new: true,  aspect: "7", text: "M$ -> B&N"   }
//, { source: "Microsoft", target: "Foxconn",        is_new: true,  aspect: "8", text: "M$ -> Fox"   }
//, { source: "Oracle",    target: "Google",         is_new: false, aspect: "9", text: "Ora -> Goo"  }
//, { source: "Apple",     target: "HTC",            is_new: false, aspect: "q", text: "App -> HTC"  }
//, { source: "Microsoft", target: "Inventec",       is_new: true,  aspect: "w", text: "M$ -> Inv"   }
  //, { source: "Microsoft", target: "Inventec",       is_new: false, aspect: "c", text: "M$ -> Inv 2" }
  //, { source: "Microsoft", target: "Inventec",       is_new: false, aspect: "t", text: "M$ -> Inv 3" }
//, { source: "Samsung",   target: "Kodak",          is_new: true,  aspect: "e", text: "Sam -> Kod"  }
//, { source: "LG",        target: "Kodak",          is_new: false, aspect: "r", text: "LG -> Kod"   }
//, { source: "RIM",       target: "Kodak",          is_new: false, aspect: "t", text: "RIM -> Kod"  }
//, { source: "Sony",      target: "LG",             is_new: false, aspect: "z", text: "Son -> LG"   }
//, { source: "Kodak",     target: "LG",             is_new: false, aspect: "u", text: "Kod -> LG"   }
//, { source: "Apple",     target: "Nokia",          is_new: false, aspect: "i", text: "App -> Nok"  }
//, { source: "Qualcomm",  target: "Nokia",          is_new: true,  aspect: "o", text: "Qua -> Nok"  }
//, { source: "Apple",     target: "Motorola",       is_new: false, aspect: "p", text: "App -> Mot"  }
//, { source: "Microsoft", target: "Motorola",       is_new: true,  aspect: "a", text: "M$ -> Mot"   }
//, { source: "Motorola",  target: "Microsoft",      is_new: true,  aspect: "s", text: "Mot -> M$"   }
//, { source: "Huawei",    target: "ZTE",            is_new: false, aspect: "d", text: "Hua -> ZTE"  }
//, { source: "Ericsson",  target: "ZTE",            is_new: false, aspect: "f", text: "Eri -> ZTE"  }
//, { source: "Kodak",     target: "Samsung",        is_new: false, aspect: "g", text: "Kod -> Sam"  }
//, { source: "Apple",     target: "Samsung",        is_new: false, aspect: "h", text: "App -> Sam"  }
//, { source: "Kodak",     target: "RIM",            is_new: false, aspect: "j", text: "Kod -> RIM"  }
//, { source: "Nokia",     target: "Qualcomm",       is_new: false, aspect: "k", text: "Nok -> Qua"  }
  ],
  forget_new_links: function() {
    var links = $.grep(LORE.links, function(link) {
      return link.is_new == false;
    });
    if(!links || links.length == 0) LORE.links = [];
    LORE.links = links;
  },
  accept_link: function(source, target, aspect) { console.log("accept_link");
    var the_source, the_target, the_index, the_text = "";
  //$.each(LORE.links, function(index, link) {
  //  if(
  //    (
  //      (link.source == source && link.target == target) ||
  //      (link.source == target && link.target == source)
  //    ) && link.aspect == aspect
  //  ) {
  //    the_source = link.source;
  //    the_target = link.target;
  //    the_index = index;
  //    the_text = link.text;
  //  }
  //}); console.log("the_index"); console.log(the_index);
  //
  //if(the_index > -1) {
  //  var link = { source: the_source, target: the_target, is_new: false, aspect: aspect, text: the_text };
  //  LORE.links[the_index] = link;
  //  LORE.render(LORE.links, LORE.concepts)
  //}
    
    $.each(LORE.links, function(index, link) {
      if(link.source == source && link.target == target && link.aspect == aspect) {
        the_source = source;
        the_target = target;
        the_index = index;
        the_text = link.text;
      }
      if(link.source == target && link.target == source && link.aspect == aspect) {
        the_source = target;
        the_target = source;
        the_index = index;
        the_text = link.text;
      }
    }); //console.log("the_index"); console.log(the_index);
    
    if(the_index > -1) {
      var link = { source: the_source, target: the_target, is_new: false, aspect: aspect, text: the_text };
      LORE.links[the_index] = link;
    }
    
    LORE.render_all_snippets(source, target);
    LORE.render();
  },
  get_links_for: function(source, target) {
    // The direction of the link does not matter! Thus, both directions are checked.
    return $.grep(LORE.links, function(link) {
      return (link.source == source && link.target == target) || (link.source == target && link.target == source);
    });
  },
  contains_links_for: function(source, target, aspect) {
    var links = get_links_for(source, target);
    if(!(links && links.length > 0)) return false;
    
    var does_contain = false;
    $.each(links, function(index, link) {
      if(link.aspect == aspect) does_contain = true;
    });
    return does_contain;
  },
  render: function(links, concepts) {
    if(!links) links = LORE.links;
    if(!concepts) concepts = LORE.concepts;
    
    // filters duplicates
    var possible_duplicates = links;
    var the_links = [];
    $.each(possible_duplicates, function(index, link) {
      // checks for multiple occurrences
      var occurrences = $.grep(the_links, function(l) {
        return link.source == l.source && link.target == l.target && link.aspect == l.aspect && link.text == l.text;
      }); //console.log("occurrences"); console.log(occurrences);
      // If a link is not in links yet, add it (but prefer "old" links if they exist!)
      if(occurrences.length < 1) {
        // prefer old links (cos this link cannot be added again!)
        if(link.is_new == false) {
          the_links.push(link);
        } else {
          var an_old_link = $.grep(possible_duplicates, function(l) {
            return link.is_new == false && link.source == l.source && link.target == l.target && link.aspect == l.aspect && link.text == l.text;
          });
          if(an_old_link.length > 0) the_links.push(an_old_link[0]);
          else the_links.push(link);
        }
      }
      
      //console.log(the_links.length)
    });
    
    links = the_links;
    LORE.links = links;
    
    
    
    
    // DIAL HOME (for the evaluation at crowdflower)
    var session = $.querystring["session_id"];
    if(session) {
      Controller["DialHome"].log_LORE(session, LORE.links, LORE.concepts);
    }
    
    
    
    
    if(links.length == 0) {
      $("#lore").text("");
      return;
    }
    
    var matrix = []
      , groups = []
      , nodeIndex = {}
      , id = 0
      , nodes = {};

    // Fetch the distinct nodes from the links.
    $.each(links, function(index, link) {
      nodes[link.source] || (nodes[link.source] = 1);
      nodes[link.target] || (nodes[link.target] = 1);
    });

    nodes = d3.keys(nodes);
    nodes.sort();
    $.each(nodes, function(index, node) {
      if (!(node in nodeIndex)) {
        nodeIndex[node] = id++;
      }
    });

    for (var node in nodeIndex) {
      var targets = matrix[nodeIndex[node]] = [];
      targets.name = node;
      for (var targetNode in nodeIndex) {
        targets[nodeIndex[targetNode]] = node === targetNode ? 1 : 0;
      }
    }
    
    var index_for_node = {};
    $.each(nodeIndex, function(node, index_as_value) {
      return index_for_node[index_as_value] = node;
    });
    
    $.each(links, function(index, link) {
      matrix[nodeIndex[link.source]][nodeIndex[link.target]] = 1;
      matrix[nodeIndex[link.target]][nodeIndex[link.source]] = 1;
    });

    var cluster = science.stats.hcluster();
    var rows = [];

    traverse(cluster(matrix), rows);
    
    $.each(rows, function(i, node) {
      nodeIndex[groups[i] = node.centroid.name] = i;
      matrix[i] = [];
      matrix[i].node = node;
      for (var j=0; j<rows.length; j++) matrix[i][j] = 0;
    });
    
    $.each(links, function(index, link) {
      matrix[nodeIndex[link.source]][nodeIndex[link.target]]++;
      matrix[nodeIndex[link.target]][nodeIndex[link.source]]++;
    });

    function traverse(tree, rows) {
      if (tree.left) traverse(tree.left, rows);
      if (tree.right) traverse(tree.right, rows);
      if (tree.centroid.name) rows.push(tree);
    }

    var distance = science.stats.distance.euclidean;

    var chord = d3.layout.chord()
      .padding(.05)
      .matrix(matrix);

    chord.matrix(matrix);

    var w = 600
      , h = 430
      , p = 40
      , r0 = Math.min(w, h) * .41
      , r1 = r0 * 1.1;

    var signe = d3.select("#lore")
      , width = signe.style("width")
      , height = signe.style("height");

    signe.select("*").remove();

    // http://colorbrewer2.org/?type=sequential&scheme=PuBu&n=9
    var fill = [//'rgb(255,247,251)', 'rgb(236,231,242)', 'rgb(208,209,230)',
      'rgb(166,189,219)',
      'rgb(116,169,207)',
      'rgb(54,144,192)',
      'rgb(5,112,176)',
      'rgb(4,90,141)',
      'rgb(2,56,88)'
    ];
    
    // http://colorbrewer2.org/?type=sequential&scheme=BuGn&n=9
    var green_fill = [//'rgb(247,252,253)', 'rgb(229,245,249)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)',
      'rgb(65,174,118)',
      'rgb(35,139,69)',
      'rgb(0,109,44)',
      'rgb(0,68,27)'
    ];
    
    var svg = d3.select("#lore")
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + (w / 2 + p) + "," + (h / 2 + p) + ")");

    var g = svg.selectAll("g.group")
        .data(chord.groups)
      .enter().append("g")
        .attr("class", "group");

    // nodes
    g.append("path")
        .style("fill", function(d) {
          var node_name = groups[d.index];
          if(node_is_new(links, node_name)) {
            return green_fill[d.index % green_fill.length];
          } else {
            return fill[d.index % fill.length];
          }
        })
        .attr("d", d3.svg.arc().innerRadius(r0).outerRadius(r1))
        .on("mouseover", function(d) {
          nodeHover(.1)(d);
          var node_name = groups[d.index];
          $("div#info").hide();
          $("div#info").html(node_name+":<br />Click to show link explanation!")
          $("div#info").show();
        })
        .on("mouseout", function(d) {
          $("div#info").hide();
          nodeHover(1)(d);
        })
        .on("click", function(d) {
          $("div#info").hide();
          var node_name = groups[d.index];
          var snippet = LORE.concepts[node_name.toLowerCase()];
          if(!snippet) snippet = "";
          
          var lore_snippets = $("div#lore-snippets");
          var content = lore_snippets.find(".content");
          lore_snippets.hide();
          content.text("");
      //  content.append("<h4 class='concept'>");
      //  content.find("h4.concept").text(node_name);
          
          content.append("<h4 class='concept'>");
          var h4 = content.find("h4.concept");
          h4.append("<a href='#' onclick=\"LORE.search_for('"+node_name+"');\">");
          var a = h4.find("a");
          a.text(node_name);
          
          content.append("<p class='snippet' style='height:20px;background:url(images/ajax-loader.gif) no-repeat;'>");
          var p = lore_snippets.find(".content p.snippet");
          
          content.append("<div id='buttons'>")
          var buttons = content.find("div#buttons")
          buttons.append("<a class='search-for' onclick=\"LORE.search_for('"+node_name+"')\" href='#'>")
          a_search_for = buttons.find("a.search-for");
          a_search_for.text("Search this concept (all new (green) links will be lost)");
          
          lore_snippets.show();
          
          if(LORE.concepts[node_name.toLowerCase()]) {
            var text = LORE.concepts[node_name.toLowerCase()];
            p.css("height", "auto");
            p.css("background", "none");
            p.html(text);
            
            lore_snippets.show();
          } else {
            lore_snippets.show();
            
            $.when(Api.wikipedia.info([node_name]))
            .then(function(info) { //console.log("info"); console.log(info);
              if(info && info.query && info.query.pages && info.query.pages) {
                var pages = info.query.pages;
                var first_page;
                $.each(pages, function(key, page) {
                  if(!first_page) first_page = page;
                }); //console.log("first_page"); console.log(first_page);
                if(first_page && first_page.pageid) {
                  var pageid = first_page.pageid;
                  $.when(Api.wikipediaservices.summaries(pageid))
                  .then(function(page) { //console.log("page"); console.log(page);
                    var summary = LORE.choose_summary(page)[0];
                    
                    // BACK HERE
                    
                    var text = summary.text;
                    if(text) {
                      $.when(LORE.wikify_all([{ text: text }]))
                      .then(function(wikifieds) { //console.log("wikifieds"); console.log(wikifieds);
                        p.css("height", "auto");
                        p.css("background", "none");
                        
                        var wikified = wikifieds[0];
                        var as_html = LORE.add_html_links(wikified);
                        p.html(as_html);
                        LORE.concepts[node_name] = as_html;
                      })
                    } else {
                      p.css("height", "auto");
                      p.css("background", "none");
                      p.text("no snipped available");
                    }
                  })
                } else {
                  console.error("no page found - cannot render node "+node_name+"!");
                  p.css("height", "auto");
                  p.css("background", "none");
                  p.text("no snipped available");
                }
              } else {
                console.error("pages not found - cannot render node "+node_name+"!");
                p.css("height", "auto");
                p.css("background", "none");
                p.text("no snipped available");
              }
            });
          }
          
        //Api.wikipediaservices.summaries(pageid);
          
        //content.find("p.snippet").text(snippet);
          lore_snippets.show();
          
          
        // OLD
        //var node_name = groups[d.index];
        //var node = node_for(LORE.concepts, node_name);
        //var lore_snippets = $("div#lore-snippets");
        //var content = lore_snippets.find(".content");
        //lore_snippets.hide();
        //content.text("");
        //content.append("<h4 class='concept'>");
        //content.find("h4.concept").text(node_name);
        //content.append("<p class='snippet'>");
        //var snippet = node.snippet;
        //if(!snippet) snippet = ""
        //content.find("p.snippet").text(snippet);
        //lore_snippets.show();
        });

    g.append("text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) {
          return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function(d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + (r0 + 32) + ")"
              + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .text(function(d) { return groups[d.index]; });
    
    // edges
    svg.append("g")
        .attr("class", "chord")
      .selectAll("path")
        .data(function() {
          var chords = [];
          $.each(chord.chords(), function(index, chord) {
            chords.push(chord);
            if (chord.source.value === 2) {
              var delta = (chord.source.endAngle - chord.source.startAngle) / 2,
                  delta2 = (chord.target.endAngle - chord.target.startAngle) / 2;
              chords.push({
                source: {
                  startAngle: chord.target.startAngle,
                  endAngle: chord.target.endAngle - delta,
                  index: chord.target.index,
                  subindex: chord.target.subindex,
                  value: 1
                },
                target: {
                  startAngle: chord.source.startAngle + delta2,
                  endAngle: chord.source.endAngle,
                  index: chord.source.index,
                  subindex: chord.source.subindex,
                  value: 1
                }
              });
              chord.target.startAngle += delta;
              chord.source.endAngle -= delta2;
            }
          });
          return chords;
        })
      .enter().append("path")
        .style("fill", function(d) {
          var source_name = groups[d.source.index];
          var target_name = groups[d.target.index];
          if(edge_is_new(LORE.links, source_name, target_name)) {
            return green_fill[d.source.index % green_fill.length];
          } else {
            return fill[d.source.index % fill.length];
          }
        })
        .attr("d", d3.svg.chord().radius(r0))
        .style("opacity", 1)
        .on("mouseover", function(d) {
          edgeHover(.1)(d);
          var source = groups[d.source.index];
          var target = groups[d.target.index];
          $("div#info").hide();
          $("div#info").html('"'+source+'" to "'+target+'":<br />Click to show link explanation!')
          $("div#info").show();
        })
        .on("mouseout", function(d) {
          $("div#info").hide();
          edgeHover(1)(d);
        })
        .on("click", function(d) {
          $("div#info").hide();
          $("div#info").html("Texts annotated with <span style='text-decoration:underline;font-style:italic;'>NEW</span> must be <span style='text-decoration:underline;font-style:italic;'>accepted</span> to survive a query change! Click on <span style='text-decoration:underline;font-style:italic;'>keep this</span> to accept them.")
          $("div#info").show();
          
          var source = groups[d.source.index];
          var target = groups[d.target.index];
          LORE.render_all_snippets(source, target);
        });

    // Returns an event handler for fading a given chord group.
    function nodeHover(opacity) {
      return function(g) {
        svg.selectAll("g.chord path")
          .filter(function(d) {
            return d.source.index != g.index && d.target.index != g.index;
          })
          .transition()
            .style("opacity", opacity);
      };
    }

    function edgeHover(opacity) {
      return function(g) {
        svg.selectAll("g.chord path")
          .filter(function(d) {
            return d.source.index != g.source.index || d.target.index != g.target.index;
          })
          .transition()
            .style("opacity", opacity);
      };
    }
    
    
    function node_is_new(links, node_name) {
      var is_new = true;
      $.each(links, function(index, link) {
        if((link.target == node_name || link.source == node_name) && !link.is_new) is_new = false;
      });
      return is_new;
    }
    
    function edge_is_new(links, source, target) {
      var is_new = false;
      $.each(links, function(index, link) {
        if(link.source == source && link.target == target && link.is_new) is_new = true;
        if(link.source == target && link.target == source && link.is_new) is_new = true;
      });
      return is_new;
    }
    
    function node_for(concepts, node_name) {
      var node = {};
      
      $.each(concepts, function(index, concept) {
        if(concept.node == node_name) node = concept;
      });
      return node;
    }
  },
  render_all_snippets: function(source, target) {
    var all_snippets = LORE.get_links_for(source, target);
    
    var possible_duplicates = all_snippets;
    all_snippets = [];
    $.each(possible_duplicates, function(index, link) {
      var occurrences = $.grep(all_snippets, function(l) {
        return link.source == l.source && link.target == l.target && link.aspect == l.aspect && link.text == l.text;
      });
      if(occurrences.length < 1) all_snippets.push(link);
    });
    
    var source_snippets = $.grep(all_snippets, function(snippet) { return snippet.source == source; })
    var target_snippets = $.grep(all_snippets, function(snippet) { return snippet.source == target; })
    
    var lore_snippets = $("div#lore-snippets");
    var content = lore_snippets.find(".content");
    lore_snippets.hide();
    content.text("");
    var concepts = [{source: source, snippets: source_snippets}, {source: target, snippets: target_snippets}];
    $.each(concepts, function(index, concept) {
      if(concept.snippets[0]) {
        content.append("<h4 class='concept'>");
      //content.find("h4.concept:last-of-type");//.text(concept.source);
        
        var h4 = content.find("h4.concept:last-of-type");//.text(concept.source);
        h4.append("<a href='#' onclick=\"LORE.search_for('"+concept.source+"');\">");
        var a = h4.find("a");
        a.text(concept.source);
        
        $.each(concept.snippets, function(index, snippet) { //console.log("concept.snippets"); console.log(concept.snippets);
          content.append("<h5 class='aspect'>")
          var aspect = snippet.aspect;
          var h5text = aspect + (snippet.is_new ? " <span style='color: #DD4B39'>NEW</span> (<a href=\"#\" onclick=\"LORE.accept_link('"+snippet.source+"', '"+snippet.target+"', '"+aspect+"');return false\">keep this connection</a>)" : "");
          content.find("h5.aspect:last-of-type").html(h5text);
          content.append("<p class='snippet'>");
          content.find("p.snippet:last-of-type").html(snippet.text);
        });
      }
    });
    lore_snippets.show();
  },
  choose_summary: function(page, times) {
    if(!times) times = 1;
    
    var the_summaries = [];
    var last_indexes = [];
    
    function array_contains_entry(array, entry) {
      var does_contain = false;
      $.each(array, function(index, item) {
        if(item == entry) does_contain = true;
      });
      return does_contain;
    }
    
    for(var time = 0; time < times; time++) {
      var summaries = page.summaries;
      var title = page.title;
      if(!summaries) return the_summaries.push({ title: title, text: "no snippet available" });
      else {}
      
      // Filter all summaries that have been previously chosen
      var old_summaries = summaries;
      summaries = [];
      $.each(old_summaries, function(index, old_summary) {
        if(!array_contains_entry(last_indexes, index)) {
          summaries.push(old_summary);
        }
      });
      
      // Reduce summaries to their texts
      var texts = $.map(summaries, function(summary) { return summary.text; });

      // Properties of a "good" summary
      var max_char_percentage = 0.1
      var min_summary_length = 100
      var max_summary_length = 300

      // compute the quality of a summary

      var char_match = /[\|\&;\$%@"<>\(\)\{\}\[\]\+\\=_;]/g
      var char_replace = /[\&;\$%@"<>\(\)\{\}\+\\=_;]/g

      var count_of_characters_in_relation_to_length = $.map(texts, function(text) {
        var char_count = text.match(char_match);
        return char_count / text.length;
      });

      // find the best text
      var best_text = null;
      for(var i = 0; i < texts.length; i++) {
        var text = texts[i];
        var char_percentage = count_of_characters_in_relation_to_length[i];
        if(char_percentage <= max_char_percentage &&
          text.length >= min_summary_length &&
          text.length <= max_summary_length) {
          best_text = text;
          last_indexes.push(i);
        }
      }

      if(best_text == null) {
        best_text = texts[0];
        last_indexes.push(0);
      }

      if(!best_text) {
        best_text = "";
      }

      best_text = best_text.replace(/\\\\n/g, "");
      best_text = best_text.replace(char_replace, "");
      
      var summs = { title: title, text: "no snippet available" };
      if(best_text) summs = { text: best_text/*.substring(0, max_summary_length)*/ };
      
      the_summaries.push(summs);
    }
    
    return the_summaries;
  },
  wikify_all: function(summaries, min_relatedness) { //console.log("wikify_all"); console.log("summaries"); console.log(summaries);
    if(!min_relatedness) min_relatedness = 0.5;
    var dfd = new $.Deferred();
    
    var texts = $.map(summaries, function(summary) { return summary.text; }); //console.log("texts"); console.log(texts); console.log(texts.length);
    var deferreds = $.map(texts, function(text) {
      return Api.wikipediaminer.wikify(text, min_relatedness);
    });
    $.when.apply($, deferreds)
    .then(function() { // strange: it returns [Object, Array, Array, ..., Array]
      var wikifieds = arguments; //console.log("arguments"); console.log(arguments); console.log(arguments.length);
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
      }); //console.log("wikified summaries"); console.log("summs"); console.log(summs);
      dfd.resolve(summs);
    });
    
    return dfd.promise();
  },
//wikify: function(summaries) { console.log("wikify"); console.log("summaries"); console.log(summaries);
//  var deferreds = $.map(summaries, function(summary) {
//    return Api.wikipediaminer.wikify(summary.text);
//  });
//  return $.when.apply($, deferreds);
//},
  add_html_links: function(snippet) {
    var fixed_markup = snippet.replace(/\[\[\[\[/g, "[[");
    var with_links = fixed_markup.replace(/\[\[([^\|]+)\|([^\]]+)\]\]/g, function(m, href, title) {
      var words = title.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      var char_match = /^.*[\|\&;\$%@"<>\(\)\{\}\[\]\+\\=_;]+.*$/g;
      var has_chars = title.match(char_match);
      if(has_chars || words.length > 5) return m;
      else return "<a data-concept='"+href+"' href='#' onclick=\"LORE.search_for('"+href+"');\">"+title+"</a>";
    //else return '<a data-concept="'+href+'" href="http://en.wikipedia.org/wiki/'+href+'">'+title+"</a>";
    });
    with_links = with_links.replace(/\[\[([^\]]+)\]\]/g, function(m, title) {
      var words = title.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
      var char_match = /^.*[\|\&;\$%@"<>\(\)\{\}\[\]\+\\=_;]+.*$/g;
      var has_chars = title.match(char_match);
      if(has_chars || words.length > 5) return m;
      else return "<a data-concept='"+title+"' href='#' onclick=\"LORE.search_for('"+title+"');\">"+title+"</a>";
    //else return '<a data-concept="'+title+'" href="http://en.wikipedia.org/wiki/'+title+'">'+title+"</a>";
    });
    var less_markup = with_links.replace(/[\[\|\]]/g, "");
    return less_markup;
  },
  search_for: function(query) {
    $("input#query").val(query);
    Controller["ResultList"].render_query();
  }
}