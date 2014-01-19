Config = {};


// *******
// * Api *
// *******

Config["Api"] = {
  wikipedia: {
    url: "http://en.wikipedia.org/w/api.php"
  },
  wikipediaminer: {
    url: "http://is64.idb.cs.tu-bs.de:8081/wikipediaminer/services/",
    url2: "http://wikipedia-miner.cms.waikato.ac.nz/services/"
  },
  wikipediaservices: {
    url: "http://is69.idb.cs.tu-bs.de:1337/"
  }
};


// ***************
// * Result List *
// ***************

Config["ResultList"] = {
  num_of_results: 10
};


// ********
// * LORE *
// ********

Config["LORE"] = {
  min_relatedness: -1,
  num_of_summaries: 8,
  min_wikify_relatedness: 0.5
};