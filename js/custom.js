(function(){

  var ncolsb = 4, nrowsb = 3;
  var ncolsa = 3, nrowsa = 16;
  var spritew = 3;
  var spriteh = 3;

  function rangenat(numel) {
    return Array.from({length: numel}, (x,i) => i+1);
  }

  const range = (start, stop, step = 1) =>
    Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)

  function authClass(an) {
    var fc = allauthors[an][1][0].toUpperCase();
    if (fc < 'A' || fc > 'Z') fc = '@';
    return fc;
  }

  function createAuthorDiv(authnumber, bookcount) {
    var s = document.createElement('div');
    s.className = "badge badge-primary badge-pill";
    s.innerHTML = bookcount;

    var a = document.createElement('a');
    a.setAttribute('href', "author" + authClass(authnumber) + ".html#a:" + authnumber);
    a.innerHTML = allauthors[authnumber][0];

    var li = document.createElement('li');
    li.className = "author_link list-group-item d-flex justify-content-between align-items-center";
    li.appendChild(a);
    li.appendChild(s);

    var ul = document.createElement('li');
    ul.className = "list-group";
    ul.appendChild(li);

    var coldiv = document.createElement('div');
    coldiv.className = "col-lg-4";
    coldiv.appendChild(ul);

    return coldiv;
  }

  function generateAuthorsTable(divlist, numcols, outdiv) {
    var drows = Math.ceil(divlist.length / numcols);
    for (var r = 0; r < drows; r++) {
      var rowdiv = document.createElement('div');
      rowdiv.className = "row";
      for (var c = 0; c < numcols && c + r*numcols < divlist.length; c++) {
        rowdiv.appendChild(divlist[c + r*numcols]);
      }
      outdiv.append(rowdiv);
    }
  }

  function refreshAuthors(npage) {
    var nentries = ncolsa * nrowsa;

    var outd = [];
    for (var i = (npage-1)*nentries; i < npage*nentries && i < authidx.length; i++)
      outd.push(createAuthorDiv(authidx[i], allauthors[authidx[i]][2]));

    $("#author_index_table").empty();
    generateAuthorsTable(outd, ncolsa, $("#author_index_table"));
  }

  function isCached(src) {
    var image = new Image();
    image.src = src;
    return image.complete;
  }

  function loadImageDefer(image, url) {
    var $downloadingImage = $("<img>");
    $downloadingImage.bind('load', {im: image}, function(e) {
      $(e.data.im).attr("src", $(this).attr("src"));
      $(e.data.im).removeAttr('width');
      $(e.data.im).removeAttr('height');
      e.data.im.className = "";
    });
    $downloadingImage.attr("src", url);
  }
  
  function setcover(obj, bid) {
    // Loading image trick
    var imgn = bid / (spritew*spriteh) | 0;
    var imgx = bid % spritew;
    var imgy = (bid / spritew | 0) % spriteh;
    var filename = "img/" + imgn + ".webp";
    var im = document.createElement('div');
    $(obj).css('background', 'url(' + filename + ')');
    $(obj).css('background-size', (spritew * 100) + '% ' + (spriteh*100) + '%');
    $(obj).css('background-position', '-' + imgx*100 + '% -' + imgy*100 + '%');
  }

  // booklist: List of book ids to render
  function refreshBooks(npage, element, full_link, seriep, booklist) {
    var outd = [];
    for (var i = 0; i < booklist.length; i++) {
      var title = allbooks[booklist[i]][0];
      var authl = allbooks[booklist[i]][2];
      var fauth = Array.isArray(authl) ? authl[0] : authl;
      var im = document.createElement('div');
      $(im).css('width', '100%');
      $(im).css('aspect-ratio', '0.666666');
      setcover(im, booklist[i]);

      var a = document.createElement('a');
      var baseurl = full_link ? ('author' + authClass(fauth) + '.html') : '';
      var hashstr = baseurl + "#a:" + fauth + ";h:" + booklist[i];
      if (!full_link) hashstr += ";p:" + npage;
      a.setAttribute('href', hashstr);
      $(a).bind('click', {hashstr: hashstr}, function(event) {
        updateHash(event.data.hashstr);
      });
      a.appendChild(im);

      var cardbody = document.createElement('div');
      cardbody.className = "card-body cover-image-card";
      cardbody.appendChild(a);

      var cardhead = document.createElement('div');
      cardhead.className = "card-header card-header-textoverflow";
      cardhead.innerHTML = "<b>" + allauthors[fauth][0] + "</b><br/>" + title;

      var carddiv = document.createElement('div');
      carddiv.className = "card text-white bg-secondary mb-3";
      carddiv.appendChild(cardhead);
      carddiv.appendChild(cardbody);

      var coldiv = document.createElement('div');
      coldiv.className = "col-lg-3 col-sm-6 col-xs-12";
      coldiv.appendChild(carddiv);

      if (seriep) {
        var infod = document.createElement('div');
        $(infod).addClass("seriescard");
        $(infod).text(allbooks[booklist[i]][4]);
        im.appendChild(infod);
      }

      outd.push(coldiv);
    }

    element.empty();

    var drows = Math.ceil(outd.length / ncolsb);
    for (var r = 0; r < drows; r++) {
      var rowdiv = document.createElement('div');
      rowdiv.className = "row";
      for (var c = 0; c < ncolsb && c + r*ncolsb < outd.length; c++) {
        rowdiv.appendChild(outd[c + r*ncolsb]);
      }
      element.append(rowdiv);
    }
  }

  function parseHash(hashstr) {
    var s = hashstr.substr(1);
    var vlist = s.split(";");
    var d = {};
    for (var i = 0; i < vlist.length; i++) {
      var sl = vlist[i].split(":");
      if (sl.length == 2)
        d[sl[0]] = sl[1];
    }
    return d;
  }

  function serHash(hashd) {
    var r = "#";
    for (var k in hashd) {
      r += k + ":" + hashd[k] + ";"
    }
    return r;
  }

  function updateSearchHash(hashstr) {
    if (hashstr.length > 0 && hashstr[0] == '#') {
      $("#generalinput").val(decodeURIComponent(hashstr.substr(1)));
      $("#search_main_button").trigger('click');
    }
  }

  function updateHash(hashstr) {
    // Format is varname:varvalue;...
    if (hashstr.length == 0 ||
        hashstr[0] != '#') {

      updateBookEntry("", "");
      $("#paginator_p_1").trigger('click');
    } else {
      var d = parseHash(hashstr);
      var pagen = 1;
      if ("p" in d)
        pagen = d["p"];

      if ("p" in d)
        $("#paginator_p_" + d["p"]).trigger('click');

      if ("h" in d)
        updateBookEntry(d["h"], d["a"]);
      else if ("c" in d)
        refreshBookSel(pagen);
      else
        updateAuthorEntry(d["a"], pagen);
    }
  }

  function getAuthBooks(authid) {
    var blist = [];
    for (var bid = 0; bid < allbooks.length; bid++) {
      if (Array.isArray(allbooks[bid][2])) {
        if (allbooks[bid][2].includes(authid))
          blist.push(bid);
      }
      else if (allbooks[bid][2] == authid)
        blist.push(bid);
    }
    return blist;
  }

  function getSerBooks(sernum) {
    var blist = [];
    for (var bid = 0; bid < allbooks.length; bid++)
      if (allbooks[bid][3] == sernum)
        blist.push(bid);
    blist.sort(function cmp(a, b) {
      var va = parseFloat(allbooks[a][4]);
      var vb = parseFloat(allbooks[b][4]);
      if (va < vb)
        return -1;
      else if (va > vb)
        return 1;
      return 0;
    });

    return blist;
  }

  function updateAuthorEntry(hash, pagen) {
    var an = hash | 0;
    var nentries = ncolsb * nrowsb;
    var offset = (pagen-1)*nentries;
    updateBookEntry("", hash);
    $("#author_name").html(allauthors[an][0]);

    // Find all books by this author
    var blist = getAuthBooks(an);

    refreshBooks(pagen, $("#author_book_grid"), false, false, blist.slice(offset, offset+nentries));
  }

  function refreshAuthBooks(npage) {
    var d = parseHash(window.location.hash);
    var authn = d["a"] | 0;
    updateAuthorEntry(authn, npage);
  }

  function updateBookEntry(bn, an) {
    if (bn == "") {
      // Go back to index
      $("#book_div").hide();
      $("#author_div").show();
    }
    else {
      $("#author_div").hide();
      $("#series_title").hide();
      // Fill in fields!
      var d = parseHash(window.location.hash);
      var page = ("p" in d) ? d["p"] : 1;
      var authl = Array.isArray(allbooks[bn][2]) ? allbooks[bn][2] : [allbooks[bn][2]];
      $("#book_title1").html(allbooks[bn][0]);
      $("#book_title2").html(allbooks[bn][0]);
      setcover("#big_cover", bn);
      $("#big_cover").css('aspect-ratio', '0.666666');
      $("#big_cover").css('width', '100%');
      var descs = binfo[bn][0].split("\n");
      $("#book_description").empty();

      if (allbooks[bn][3]) {
        $("#series_title").text(allseries[allbooks[bn][3]] + " [" + allbooks[bn][4] + "]");
        $("#series_title").attr("href", "series.html#s:" + allbooks[bn][3]);
        $("#series_title").show();
      }

      $("#author_list").empty();
      for (var i = 0; i < authl.length; i++) {
        var an = authl[i];
        var a = document.createElement('a');
        $(a).text(allauthors[an][0]);
        $(a).addClass("authsub");
        $(a).attr('href', "author" + authClass(an) + ".html#a:" + an);
        $("#author_list").append(a);
      }

      for (var i = 0; i < descs.length; i++) {
        var par = document.createElement('p');
        par.className = "lead";
        $(par).text(descs[i]);
        $("#book_description").append(par);
      }
      var fc = authClass(an);
      $("#breadcrumb_page_back").attr('href', '#p:' + page + ";a:" + an);
      $("#breadcrumb_page_back").html(allauthors[an][0]);
      $("#breadcrumb_page_back_char").attr('href', 'author_index_' + fc + '.html');
      $("#breadcrumb_page_back_char").html(fc);

      $("#pub_year").text(binfo[bn][2]);
      $("#pub_year").removeAttr("href");
      var yidx = bkyears.indexOf(binfo[bn][2]);
      if (yidx >= 0)
        $("#pub_year").attr("href", "year.html#c:" + yidx);

      //    Ruta a la base de datos que me encontré subida por otra persona
            $("#epub_link").attr('href', "https://biblioteca.hogar.dnset.com/biblioteca/" + binfo[bn][3] + ".epub");

      //    Ruta a la base de datos en ASUS SSD
      //    $("#epub_link").attr('href', "https://casa-pineda.asuscomm.com/AICLOUD625530465/biblioteca/" + binfo[bn][3] + ".epub");

      $("#div_subjects").empty();
      for (var i = 0; i < 32*3; i++) {
        if (binfo[bn][4 + ((i / 32)|0)] & (1 << (i % 32))) {
          var sp = document.createElement('a');
          $(sp).attr('href', 'subject.html#c:' + i);
          sp.className = "badge badge-margin badge-light";
          sp.innerHTML = genrelist[i];
          $("#div_subjects").append(sp);
        }
      }
      $("#book_div").show();
      $("#div_pages").text(binfo[bn][1]);

      // Scroll up if the user is down the top of the book box
      var pos = $("#topanchor").offset().top;
      if ($(document).scrollTop() > pos)
        $('html, body').animate({scrollTop: pos}, 400);
    }
  }

  function genPagButtons(paginatorid, fncallback, pagen, pagec, pages) {
    var bdiv = document.createElement('div');
    var d = parseHash(window.location.hash);
    var extra = "a" in d ? ";a:" + d["a"] : "";
    extra += "s" in d ? ";s:" + d["s"] : "";
    extra += "c" in d ? ";c:" + d["c"] : "";

    bdiv.className = "btn-group mr-2";
    bdiv.setAttribute('role', "group");

    for (var i = 0; i < pages.length; i++) {
      var pageseq = pages[i];
      var b = document.createElement('a');
      b.className = "btn btn-" + (pageseq == pagen ? "primary" : "secondary");
      b.setAttribute("id", "paginator_p_" + pageseq);
      b.setAttribute("type", "button");
      b.setAttribute("href", "#p:" + pageseq + extra);
      b.innerHTML = pageseq;
      $(b).bind('click', {pn: pageseq, pc: pagec}, function(event) {
        var data = event.data;
        fncallback(data.pn);
        refreshPaginator(paginatorid, fncallback, data.pn, data.pc);
      });
      bdiv.appendChild(b);
    }

    return bdiv;
  }

  function refreshPaginator(paginatorid, fncallback, pagen, pagec) {
    var nmid = 7, next = 2;         // Center and side selectors
    var maxsel = nmid + next * 2;   // Total max selectors
    var nside = (maxsel+1) >> 1;    // For two selectors

    if (pagec <= maxsel) {
      paginator = [range(1, pagec+1)];
    }
    else {
      if (pagen <= nside-1 || pagen > pagec-nside+1) {
        paginator = [ range(1, nside+1), range(pagec+1-nside, pagec+1) ];
      } else {
        paginator = [ range(1, next+1), range(pagen-(nmid>>1), pagen+(nmid>>1)+1), range(pagec+1-next, pagec+1) ];
      }
    }

    $("#" + paginatorid).empty();
    if (pagec > 1) {
      for (var i = 0; i < paginator.length; i++) {
        var elem = genPagButtons(paginatorid, fncallback, pagen, pagec, paginator[i]);
        $("#" + paginatorid).append(elem);
      }
    }
  }

  function refreshBookSel(npage) {
    var d = parseHash(window.location.hash);
    var subc = d["c"] | 0;

    var nentries = ncolsb * nrowsb;
    var outd = [];
    for (var i = (npage-1)*nentries; i < npage*nentries && i < selbooklist[subc][1].length; i++)
      outd.push(selbooklist[subc][1][i]);

    refreshBooks(npage, $("#book_grid"), true, false, outd);
  }

  function refreshBookSeries(npage) {
    var nentries = ncolsb * nrowsb;
    var outd = [];
    for (var i = (npage-1)*nentries; i < npage*nentries && i < seriesbooklist.length; i++)
      outd.push(seriesbooklist[i]);

    refreshBooks(npage, $("#book_grid"), true, true, outd);
  }

  function readSettings() {
    // Parse local storage settings
    var nrbooks = localStorage.getItem("bookrows");
    if (nrbooks != null)
      nrowsb = nrbooks | 0;
    var nrauths = localStorage.getItem("authrows");
    if (nrauths != null)
      nrowsa = nrauths | 0;  
  }

  var reloadpage = null;
  var seriesbooklist = [];
  (function(){
    readSettings();

    // Settings handling
    if ($("#save_settings").length) {
      $("#save_settings").bind('click', function(event) {
        localStorage.setItem("bookrows", $("#bkrow option:selected").val());
        localStorage.setItem("authrows", $("#atrow option:selected").val());
        readSettings();
        $("#settingspanel").hide();
        $("#paginator_p_1").trigger('click');
        if (reloadpage != null) {
          reloadpage();
          var nd = parseHash(window.location.hash);
          nd["p"] = "1";
          window.location.hash = serHash(nd);
        }
      });

      $("#dism_settings").bind('click', function(event) {
        $("#settingspanel").hide();
      });
    }

    var d = parseHash(window.location.hash);
    var pn = "p" in d ? (d["p"] | 0) : 1;
    if (typeof authidx != "undefined") {
      refreshAuthors(pn);
      reloadpage = function() {
        refreshPaginator("author_index_paginator", refreshAuthors, pn, Math.ceil(authidx.length / (ncolsa*nrowsa)));
      };
    }
    else if (typeof selbooklist != "undefined") {
      var subc = d["c"] | 0;
      $("#cat_title").text(selbooklist[subc][0]);
      refreshBookSel(pn);
      reloadpage = function() {
        refreshPaginator("selbook_index_paginator", refreshBookSel, pn, Math.ceil(selbooklist[subc][1].length / (ncolsb*nrowsb)));
      };
    }
    else if ($("#author_book_paginator").length) {
      var d = parseHash(window.location.hash);
      var authn = d["a"] | 0;
      var num = getAuthBooks(authn).length;
      refreshAuthBooks(pn);
      reloadpage = function() {
        refreshPaginator("author_book_paginator", refreshAuthBooks, pn, Math.ceil(num / (ncolsb*nrowsb)));
      };
    }
    else if ($("#series_book_paginator").length) {
      var d = parseHash(window.location.hash);
      var sern = d["s"] | 0;
      seriesbooklist = getSerBooks(sern);
      var num = seriesbooklist.length;
      $("#series_name").text(allseries[sern]);
      refreshBookSeries(pn);
      reloadpage = function() {
        refreshPaginator("series_book_paginator", refreshBookSeries, pn, Math.ceil(num / (ncolsb*nrowsb)));
      };
    }

    if (reloadpage != null)
      reloadpage();

    function createBookResult(r, htmlelem) {
      var booklist = [];
      for (var i = 0; i < r.length; i++) {
        booklist.push(r[i]);
      }
      refreshBooks(1, htmlelem, true, false, booklist);
    }

    // General search
    var corpus = [];

    function recalc_corpus() {
      // Process books and authors
      corpus = [];
      if ($("#search_title").is(':checked')) {
        for (var i = 0; i < allbooks.length; i++) {
          corpus.push(fuzzysort.prepare(allbooks[i][0], -i));
          corpus.push(fuzzysort.prepare(allbooks[i][1], -i));
        }
      }
      if ($("#search_author").is(':checked')) {
        for (var i = 0; i < allauthors.length; i++) {
          corpus.push(fuzzysort.prepare(allauthors[i][0], i));
          corpus.push(fuzzysort.prepare(allauthors[i][1], i));
        }
      }
    }

    if ($("#generalinput").length) {
      // Process books and authors
      recalc_corpus();

      $("#search_title").click(recalc_corpus);
      $("#search_author").click(recalc_corpus);

      var wipecb = function () {
        $('#searchout').empty();
        $('#noresults').show();
      }

      var searchcb = function () {
        // Do a search in the books database!
        var q = $("#generalinput").val();
        var r = fuzzysort.go(q, corpus, {limit: 32});

        if (r.length > 0) {
          // Check first result, author or book?
          var rb = [], ra = [];
          for (var i = 0; i < r.length; i++) {
            var eidx = r[i].obj;
            if (eidx < 0) {
              if (rb.indexOf(-eidx) < 0)
                rb.push(-eidx);
            } else {
              if (ra.indexOf(eidx) < 0)
                ra.push(eidx);
            }
          }

          // Create book result
          var bookdiv = document.createElement('div');
          bookdiv.className = "bs-component pagerbar text-center";
          refreshBooks(1, $(bookdiv), true, false, rb);

          var authlistdiv = document.createElement('div');
          authlistdiv.className = "bs-docs-section";

          // Create author list
          var authlist = [];
          for (var i = 0; i < ra.length; i++)
            authlist.push(createAuthorDiv(ra[i], allauthors[ra[i]][2]));

          $(authlistdiv).empty();
          generateAuthorsTable(authlist, ncolsa, $(authlistdiv));

          var t1 = document.createElement('h3');
          t1.className = "display-6-m";
          t1.innerHTML = "Books";
          var t2 = document.createElement('h3');
          t2.className = "display-6-m";
          t2.innerHTML = "Authors";

          var firstbook = r[0].obj < 0;
          $('#noresults').hide();
          $("#searchout").empty();
          if (firstbook) { // Book title
            $("#searchout").append(t1);
            $("#searchout").append(bookdiv);
            if (ra.length) {
              $("#searchout").append(t2);
              $("#searchout").append(authlistdiv);
            }
          } else { // Author
            $("#searchout").append(t2);
            $("#searchout").append(authlistdiv);
            if (rb.length) {
              $("#searchout").append(t1);
              $("#searchout").append(bookdiv);
            }
          }
        }
        else
          wipecb();
      };

      $("#search_main_button").on('click', function() {
        $("#generalinput").trigger('change');
        setTimeout(searchcb, 1);
      });

      var timer = null;
      $("#generalinput").on('keyup paste change', function() {
        if (timer != null) {
            clearTimeout(timer);
            timer = null;
        }

        var q = $("#generalinput").val();
        if (q.length > 3) {
          timer = setTimeout(searchcb, 1000);
        }
        else
          wipecb();
      });

      $("#generalinput").on('keypress', function(ev) {
        if (ev.keyCode === 13) {
          $("#search_main_button").click();
        }
      });
    }

    if ($("#searchout").length) {
      $(window).on('hashchange', function() {
        updateSearchHash(window.location.hash);
      });
      updateSearchHash(window.location.hash);
    }else{
      // Keep listening on hash updates, sometimes happens when going back/forward
      $(window).on('hashchange', function() {
        updateHash(window.location.hash);
      });

      // Select a book if appropriate and a page
      updateHash(window.location.hash);
    }
  })();

  $(window).scroll(function () {
      var top = $(document).scrollTop();
      $('.splash').css({
        'background-position': '0px -'+(top/3).toFixed(2)+'px'
      });
      if(top > 50)
        $('#home > .navbar').removeClass('navbar-transparent');
      else
        $('#home > .navbar').addClass('navbar-transparent');
  });

  $("a[href='#']").click(function(e) {
    e.preventDefault();
  });

  $('#gsearchf').submit( function() {              
    goUrl = 'search.html#' + encodeURIComponent($('#ginput').val());
    window.location = goUrl;
    return false;
  });
  
  $("#settings-button").on("click", function(){
    $('#bkrow option[value='+nrowsb+']').attr('selected','selected'); 
    $('#atrow option[value='+nrowsa+']').attr('selected','selected'); 

    $("#settingspanel").show();
    $("html, body").animate({ scrollTop: 0 }, "slow");
  });

})();



