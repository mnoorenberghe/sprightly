$(document).ready(function() {
    if (navigator.userAgent.indexOf('3.7') !== -1)
        sprightly.supports_transitions = true;
    
    sprightly.refresh_minute();
    sprightly.refresh_five_minutes();
    sprightly.refresh_hour();
    
    window.setInterval(sprightly.refresh_second, 1000);
    window.setInterval(sprightly.refresh_minute, 60000);
    window.setInterval(sprightly.refresh_five_minutes, 60000 * 5);
    window.setInterval(sprightly.refresh_hour, 60000 * 60);
});

var sprightly = {
    last_tweet_date: null,
    firefox36_downloads: 0,
    firefox_dps: [],
    supports_transitions: false,
    tweet_queue: [],
    
    refresh_second: function() {
        sprightly.update_firefox_counts();
        sprightly.next_tweet();
    },
    
    refresh_minute: function() {
        sprightly.update_time();
        
        $('time.relative').each(function(e, t) {
            var time = $(t);
            time.text(date_stuff.time_ago_in_words_with_parsing(time.attr('datetime')));
        });
        
        $.getJSON('data/minutely.txt', function(data) {
            sprightly.update_firefox_downloads(data.firefox_downloads);
            sprightly.update_firefox_tweets(data.firefox_tweets);
        });
    },
    
    refresh_five_minutes: function() {
        sprightly.update_511();
        sprightly.update_caltrain();
    },
    
    refresh_hour: function() {
        $.getJSON('data/hourly.txt', function(data) {
            sprightly.update_amo_downloads(data.amo_downloads);
            sprightly.update_weather(data.weather);
            sprightly.update_caltrain(data.caltrain);
        });
    },
    
    update_time: function() {
        $('#time').text(date_stuff.get_pretty_time());
        $('#date').text(date_stuff.get_pretty_date());
       },
    
    update_firefox_downloads: function(data) {
        if (sprightly.firefox36_downloads == 0)
            sprightly.firefox36_downloads = data.total;
        
        sprightly.firefox_dps = sprightly.firefox_dps.concat(data.rps);
    },
    
    update_firefox_counts: function() {
        if (sprightly.firefox_dps.length == 0)
            return;
        
        var change = sprightly.firefox_dps.shift();
        sprightly.firefox36_downloads += change;
        
        $('#firefox .downloads .fx36 .count').text(add_commas(sprightly.firefox36_downloads));
        $('#firefox .downloads .total .count').text(add_commas(1033197939 + sprightly.firefox36_downloads));
        
        if (sprightly.supports_transitions) {
            $('#firefox .downloads .change').append('<span>+' + change + '</span>');
            $('#firefox .downloads .change span').addClass('go').bind('transitionend', function(e) {
                $(this).remove();
            });
        }
    },
    
    update_firefox_tweets: function(data) {
        data.reverse();
        $.each(data, function(i, tweet) {
            // Censor bad words for the children, pets, and interns
            tweet.text.replace(/fuck|shit|cunt|nigger|Justin Bieber/gi, '[YAY FIREFOX!]');
            
            tweet.dateobj = new Date(tweet.date);
            if (tweet.dateobj > sprightly.last_tweet_date) {
                sprightly.tweet_queue.push(tweet);
                sprightly.last_tweet_date = tweet.dateobj;
            }
        });
    },
    
    next_tweet: function() {
        if (sprightly.tweet_queue.length == 0)
            return;
        
        var tweet = sprightly.tweet_queue.shift();
        
        $('#firefox .tweets ul').prepend('<li class="hidden"><img src="' + tweet.avatar + '" /><span class="author">' + tweet.author + '<time datetime="' + tweet.date + '" class="relative">' + date_stuff.time_ago_in_words(tweet.dateobj) + '</time></span>' + tweet.text + '</li>').find('.hidden').slideDown();
    },
    
    update_caltrain: function() {
        
    },
    
    update_511: function() {
        var currentTime = new Date();
        
        $('#traffic-map').css('background-image', 'http://traffic.511.org/portalmap2.gif?' + currentTime.getTime());
        $('#traffic time').attr('datetime', currentTime).text(date_stuff.time_ago_in_words(currentTime));
    },
    
    update_weather: function(data) {
        $('#weather img').attr('src', data.img);
        $('#weather span').html(data.conditions.replace(' F', '&deg; F'));
    },
    
    update_amo_downloads: function(data) {
        
    }
    
};

function add_commas(nStr) {
  nStr += '';

  x       = nStr.split('.');
  x1      = x[0];
  x2      = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;

  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

var date_stuff = {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'],
    
    get_pretty_time: function() {
        var currentTime = new Date();
        var hours = currentTime.getHours();
        var minutes = currentTime.getMinutes();

        var suffix = "AM";
        if (hours >= 12) {
            suffix = "PM";
            hours = hours - 12;
        }
        if (hours == 0) {
            hours = 12;
        }

        if (minutes < 10)
            minutes = "0" + minutes

        return hours + ":" + minutes + " " + suffix;
    },
    
    get_pretty_date: function() {
        var currentTime = new Date();
        var month = this.months[currentTime.getMonth()];
        var day = this.weekdays[currentTime.getDay()];
        var date = currentTime.getDate();
    
        return day + ', ' + month + ' ' + date;
    },
    
    time_ago_in_words_with_parsing: function(from) {
        var date = new Date;
        date.setTime(Date.parse(from));
        return this.time_ago_in_words(date);
    },

    time_ago_in_words: function(from) {
        return this.distance_of_time_in_words(new Date, from);
    },

    distance_of_time_in_words: function(to, from) {
        var distance_in_seconds = ((to - from) / 1000);
        var distance_in_minutes = Math.floor(distance_in_seconds / 60);

        if (distance_in_minutes == 0) { return 'less than a minute ago'; }
        if (distance_in_minutes == 1) { return 'a minute ago'; }
        if (distance_in_minutes < 45) { return distance_in_minutes + ' minutes ago'; }
        if (distance_in_minutes < 90) { return 'about 1 hour ago'; }
        if (distance_in_minutes < 1440) { return 'about ' + Math.floor(distance_in_minutes / 60) + ' hours ago'; }
        if (distance_in_minutes < 2880) { return '1 day ago'; }
        if (distance_in_minutes < 43200) { return Math.floor(distance_in_minutes / 1440) + ' days ago'; }
        if (distance_in_minutes < 86400) { return 'about 1 month ago'; }
        if (distance_in_minutes < 525960) { return Math.floor(distance_in_minutes / 43200) + ' months ago'; }
        if (distance_in_minutes < 1051199) { return 'about 1 year ago'; }

        return 'over ' + Math.floor(distance_in_minutes / 525960) + ' years ago';
    }
};
