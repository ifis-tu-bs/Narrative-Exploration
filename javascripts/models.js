// Models use the Apis (and their cache) to map data into structures.
Model = {};


// *********** Corresponds to 
// * Concept * a Wikipedia page.
// *********** 

Model["Concept"] = function(id, title, url, summaries, aspects) {
  this.title = title;
  this.url = url;
  this.summaries = summaries;
  this.aspects = aspects;
  
  if(!title) console.error("Concept attribute 'title' undefined!");
  if(!url) console.error("Concept attribute 'url' undefined!");
  if(!summaries) console.error("Concept attribute 'summaries' undefined!");
  if(!aspects) console.error("Concept attribute 'aspects' undefined!");
  
  //this.from_
};


// **********
// * Aspect *
// **********

Model["Aspect"] = function(title, summaries) {
  this.title = title;
  this.summaries = summaries;
};