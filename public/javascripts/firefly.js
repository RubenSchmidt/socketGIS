
(function($){var defaults={images:["http://dharmmotyar.googlecode.com/svn/trunk/images/spark.png","http://dharmmotyar.googlecode.com/svn/trunk/images//spark2.png","http://dharmmotyar.googlecode.com/svn/trunk/images/spark3.png","http://dharmmotyar.googlecode.com/svn/trunk/images/spark4.png"],total:40};$.firefly=function(settings){$.firefly.settings=$.extend({},defaults,settings);if($.firefly.preloadImages())for(i=0;i<$.firefly.settings.total;i++)$.firefly.fly($.firefly.create($.firefly.settings.images[$.firefly.random($.firefly.settings.images.length)]));
    return};$.firefly.create=function(img){spark=$("<img>").attr({"src":img}).hide();$("#testId").append(spark);return spark.css({"position":"absolute","z-index":1,top:$.firefly.random($(window).height()-150),left:$.firefly.random($(window).width()-150)}).show()};$.firefly.fly=function(sp){$(sp).animate({top:$.firefly.random($(window).height()-150),left:$.firefly.random($(window).width()-150),opacity:$.firefly.opacity()},($.firefly.random(10)+5)*1100,function(){$.firefly.fly(sp)})};
    $.firefly.preloadImages=function(){var preloads=new Object;for(i=0;i<$.firefly.settings.images.length;i++){preloads[i]=new Image;preloads[i].src=$.firefly.settings.images[i]}return true};$.firefly.random=function(max){return Math.ceil(Math.random()*max)-1};$.firefly.opacity=function(){op=Math.random();if(op<0.2)return 0;else return 1}})(jQuery);