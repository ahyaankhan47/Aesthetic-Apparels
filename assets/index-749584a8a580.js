
  (function(){
    var headingSel = 'section h1, section h2, section h3';
    var textSel = 'section p, section .eyebrow';
    document.querySelectorAll(headingSel).forEach(function(el){ el.classList.add('reveal','reveal-heading'); });
    document.querySelectorAll(textSel).forEach(function(el){ el.classList.add('reveal'); });

    var targets = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){
      targets.forEach(function(el){ el.classList.add('in-view'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -60px 0px'});
    targets.forEach(function(el){ observer.observe(el); });
  })();
