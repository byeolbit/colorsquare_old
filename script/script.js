var socket = io();
var userColor=null;
var userNick=null;
var userTeam=null;
var userPoint = 0;
var tempColor=null;
var teamNum=null;
var userPing=true;

var safeColors = ['00','33','66','99','cc','ff'];
var rand = function() {
    return Math.floor(Math.random()*6);
}
var randomColor = function() {
    var r = safeColors[rand()];
    var g = safeColors[rand()];
    var b = safeColors[rand()];
    return "#"+r+g+b;
}
// random color generator by mtf

var setUserInfo = function(){
    $('.currentTeam').text(userTeam);
    $('.currentColor').css('background-color',userColor);
    //socket.emit('request points',userID);
}

var updatePoint = function(point){
    for(i=1;i<=point;i++){
        var cell = '.pointCell:nth-child('+i+')';
        $(cell).addClass('ready');
    }
    for(i=point+1;i<=20;i++){
        var cell = '.pointCell:nth-child('+i+')';
        $(cell).removeClass('ready');
    }
    userPoint = point;
    //$('.currentPoint').html(userPoint);
}

function scrollScreen(event,tx,ty){
    var x,y;
    x = event.pageX-100;
    y = event.pageY-200;
    $('html, body').animate({ scrollLeft:tx-x, scrollTop:ty-y },2000,'easeInOutQuint');
    //$('html, body').animate({},500);
    //window.scrollBy(tx-x, ty-y);
}

var pTimer;

function pingCal(){
    var i =20.0;
    function p(){
        i -= 0.1;
        $('.pingInfo p').text('Ping : '+i.toFixed(1)+' sec left');
    }
    pTimer = setInterval(p,100);
}

$(document).ready(function () {
    //$('#howto1').css('visibility','hidden');

    tempColor=randomColor();

    for(var i=1; i<1601; i++){
        $('.cellField').append('<div class = "cell '+i+'"></div>');
    }

    for(var i=1; i<21; i++){
        $('.currentPoint').append('<div class = "pointCell '+i+'"></div>');
    }
    socket.on('new user',function(nick){
            userNick = nick;
            socket.emit('request init');
            //console.log('client : '+userID);
            //socket.emit('use',userID);
            //for debug
    });

    /* This is for ping menu */

    document.oncontextmenu = function() {return false;};

    $(document).on('mousemove',function(e){
        $('.pingInfo').offset({top:e.pageY+10, left:e.pageX+10});
    });

    $('.popup .make_team .contents .colorbox').css('background-color',tempColor);


    $('.popup .make_team button#genteam').prop('disabled',true);


    $('li.pingli').click(function(e){
        var ox = $(this).text.splice(22,4);
        alert(ox);
    });


    $('.cellField .cell').bind('mousedown', function(e){
        if(e.button==0){
            if(userPoint>0){
                socket.emit('change cell',e.target.className);
                return false;
            }
        }
        else{
            if(userTeam != null && userPing){
                var eventData = function(e){
                    this.pageX = e.pageX;
                    this.pageY = e.pageY;
                }
                socket.emit('request ping',new eventData(e));
                return false;
            }
        }
    });

    socket.on('return userPoint',function(point){
        updatePoint(point);
    });

    /* Join to team */
    $('.popup .team_select button').click(function(){
        socket.emit('join team', $('.popup .team_select select#teamlists option:selected').text());
    });

    socket.on('joined',function(teamName, teamColor, teamNumber){
        userColor = teamColor;
        userTeam = teamName;
        teamNum = teamNumber;
        $('#popup1').fadeOut();
        $('body').append('');
        $('#howto1').fadeIn();
    });

    $('#howto1').click(function(){
        $('#howto1').fadeOut();
        setUserInfo();
        $('.pingInfo').css('visibility','visible');
    });

    $('.popup .make_team input#new_team_name').on('input', function(){

        var inputbox=$(this);
        //var inputVal=$(this).val();
        var inputLen=$(this).val().length;

        //console.log(input); //for debug

        if(inputLen > 0 && inputLen < 25){
            inputbox.removeClass('invalid').addClass('valid');
            $('.popup .make_team button#genteam').prop('disabled',false);
        }
        else{
            inputbox.removeClass('valid').addClass('invalid');
            $('.popup .make_team button#genteam').prop('disabled',true);
        }
    });

    /* Refresh team color */
    $('.popup .make_team button#refresh').click(function(){
        socket.emit('newColor check',randomColor());
    });

    socket.on('color check result',function(result){
        if(result != -1){
            tempColor = result;
            $('.popup .make_team .contents .colorbox').css('background-color',tempColor);
        }
        else{
             socekt.emit('newColor check',tempColor);
        }
    });

    /* Generate team */
    $('.popup .make_team button#genteam').click(function(){
        socket.emit('gen team',$('.popup .make_team input#new_team_name').val(),tempColor);
    });


    socket.on('gen result',function(isGen){
        if(!isGen){
            alert('The team name is already exist!');
        }
    });

    /* Cell color changing */
    socket.on('change cell', function(colora, className, stack, isChanged){
        for(var i=0; i<5; i++){
            $(className[i]).css('background-color', colora[i]);
            if(stack[i]!=0){
                $(className[i]).text(stack[i]);
            }
            else{
                $(className[i]).text('　');
            }
            if(isChanged[i]==-1){
                $(className[i]).effect('bounce',{times:3}, 150);
            }

        }

    });

    socket.on('load colors', function(cellColor, stacks){
        for(i=1; i<1601; i++){
            var cellName = '.cellField .cell.'+i;
            $(cellName).css('background-color',cellColor[i]);
            if(stacks[i]!=0){
                $(cellName).text(stacks[i]);
            }
            else{
                $(cellName).text('　');
            }
        }
    });


    socket.on('load teams', function(teamList){
        var sel = $('<select id="teamlists" title="select_team">').appendTo('.popup .team_select label');
        $(teamList).each(function(){
            sel.append($("<option>").text(this.name));
        });
    });


    socket.on('change score', function(list){
      $('#slist').html('');
      $(list).each(function(){
          $('#slist').append($('<li>').text(this));
      });
    });

    socket.on('team score', function(score){
      $('#score').text(score);
    });

    socket.on('team memeber changed', function(teamMem){
      $('#mN').text(teamMem);
    });

    /* team chat */
    $('#t').on('keypress', function(event){
        if(event.keyCode == 13 && $('#t').val()!=''){
            socket.emit('send team msg',$('#t').val());
            $('#t').val('');
        }
    });

    $('#ts').click(function(){
            socket.emit('send team msg',$('#t').val());
            $('#t').val('');
    });

    /* global chat */
    $('#g').on('keypress', function(event){
        if(event.keyCode == 13){
            socket.emit('send global msg',$('#g').val());
            $('#g').val('');
        }
    });

    $('#gs').click(function(){
            socket.emit('send global msg',$('#g').val());
            $('#g').val('');
    });

    socket.on('team msg',function(msg, nick){
        var lis;
        if(nick == userNick){
            lis = '<li class="you">'
        }
        else{
            lis = '<li>';
        }
        $('#ct').append($(lis).text(msg));
        $('#ct').animate({scrollTop: $('#ct')[0].scrollHeight});
    });

    socket.on('global msg', function(msg, nick){
        var lis;
        if(nick == userNick){
            lis = '<li class="you">'
        }
        else{
            lis = '<li>';
        }
        $('#cg').append($(lis).text(msg));
        $('#cg').animate({scrollTop: $('#cg')[0].scrollHeight});
    });

    socket.on('send ping', function(cdp, cdm, x, y){
        var wID=x+'i'+y;
        y-=8;
        x-=8;
        $('body').append('<div class = "markerWrap" id="'+wID+'" style="top:'+(y)+'px; left:'+x+'px;"><div class="marker" id ="'+cdm+'"></div><div class="pulse" id ="'+cdp+'"></div></div>');
        $('#'+wID).effect('bounce',{times:4},700);
        userPing = false;
        pingCal();
        setTimeout(function(){
            $('#'+cdp).fadeOut("slow");
            $('#'+cdm).fadeOut("slow");
            $('#'+wID).remove();
            setTimeout(function(){
                clearInterval(pTimer);
                $('.pingInfo p').text('Ping : ready');
                userPing = true;}, 10000);
            },10000);
        });

      socket.on('ping msg', function(msg){
          $('#ct').append($('<li class="pingli">').html("&nbsp;System : "+msg+" (click to move)"));
          $('#ct').animate({scrollTop: $('#ct')[0].scrollHeight});
      });

      socket.on('online users', function(n){
          $('.userInfo p').text('users online : '+n);
      })

});
