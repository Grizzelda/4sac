(function()  {
//template from: https://blogs.sap.com/2020/01/27/your-first-sap-analytics-cloud-custom-widget-introduction/
//customStufff-------------------------------------------------------------------------------------------------\/

   let demoData={
    //time-format: ISO8601
    appConf:{
     backGroundColor:"black",
     sectorLineColor:"white",
     hourLableColor:"white",
     format24:true
    },
    instances:[
     {
      startDateTime:"2021-10-18T08:00:00+00:00",
      endDateTime:  "2021-10-18T09:30:00+00:00",
      lable:"להסיע את הילדים",
      backGroundColor:"tomato",
      textColor:"black"
     },
     {
      startDateTime:"2021-10-18T10:00:00+00:00",
      endDateTime:  "2021-10-18T12:30:00+00:00",
      lable:"לעבוד על מצגת",
      backGroundColor:"purple",
      textColor:"black"
     },{
      startDateTime:"2021-10-18T16:00:00+00:00",
      endDateTime:  "2021-10-18T19:30:00+00:00",
      lable:"לשחק בפלייסטיישן",
      backGroundColor:"pink",
      textColor:"black"
     },{
      startDateTime:"2021-10-18T00:00:00+00:00",
      endDateTime:  "2021-10-18T05:30:00+00:00",
      lable:"לישון",
      backGroundColor:"blue",
      textColor:"black"
     }
    ]
   }

   let format24Global=false;
   let diamaterGlobal=0;   
   let globalXrotation=0;
   let globalYrotation=0;

   const genStyle=()=>{
    return "<style>"+
            "#gyroDisplay{"+
            "perspective: 1000px;"+
            "}"+
            "#testingGround{"+
            "padding:0px;"+
            "left:0px;"+
            "right:0px;"+
            "margin:auto;"+
            "transition:1s;"+
            "}"+
           "</style>";
   }

   const mkGraph=()=>{
    let targetElement=document.createElement('div');
    targetElement.id="testingGround";
    let targetWrapper=document.createElement('div');
    targetWrapper.id="gyroDisplay";
    targetElement.addEventListener('mouseenter', () => classChangerEnter(this) );
    targetElement.addEventListener('onmouseleave', () => classChangerLeave(this) );
    const incomingData=getData();
    if(incomingData!==null){
     format24Global=incomingData.appConf.format24;
     const componentID=setComponentID();//uniqName
     const viewSelector=window.innerWidth>window.innerHeight?window.innerHeight:window.innerWidth;
     let mainSize=(viewSelector-(viewSelector/7))+"px";
     const d= new Date();
     globalXrotation=0;
     globalYrotation=0;
     //const targetElement=document.getElementById("testingGround");//where
     targetElement.style.width=mainSize;
     targetElement.style.height=mainSize;
     elementTimeRotation();
     elementActualTimeRotation(targetElement);
     const diamater=targetElement.clientHeight>targetElement.clientWidth?targetElement.clientWidth:targetElement.clientHeight;
     diamaterGlobal=diamater;
     targetElement.innerHTML="<svg "+
                              "gsectokey='"+componentID.key+"' "+
                              "id='"+componentID.name+"' "+
                              "class='sectograph' "+
                              "height='"+diamater+"' "+
                              "width='"+diamater+"' "+
                              "viewBox='0 0 "+diamater+" "+diamater+
                              "'>"+
                              " <defs>"+
                              "  <filter id='darkShadow'>"+
                              "   <feDropShadow dx='0' dy='0' stdDeviation='0.5' flood-color='white'/>"+
                              "  </filter>"+
                              " </defs>"+
                              "</svg>"
     let svgComponent=document.getElementById(componentID.name);
     svgComponent.innerHTML+=
                            circleMaker(diamater,diamater/2,incomingData.appConf.backGroundColor,1,"background")+"\n"+
                            linesAndLablesMaker(diamater,incomingData.appConf.format24)+"\n"+
                            dataSliceConsumer(incomingData.instances,diamater,incomingData.appConf.format24).slices+
                            "<g id='clockUpdateComponent'>"+
                             clockView(diamater,incomingData.appConf.format24);
                            "</g>";
    }
    targetWrapper.appendChild(targetElement);
    return targetWrapper;
   }
   
   const tickUpdater=()=>{
    const loc=document.getElementById("clockUpdateComponent");
    setInterval(()=>{loc.innerHTML=clockView(diamaterGlobal,format24Global);},1000);
   }

   const elementTimeRotation=()=>{
    const d= new Date();
    let deg=rotationManager(d.getHours(),d.getMinutes(),format24Global);
    let degX=(Math.sin((deg%360)*Math.PI/180)*60);
    let degY=-(Math.cos((deg%360)*Math.PI/180)*60);
    globalXrotation=degX;
    globalYrotation=degY;
   }

   const elementActualTimeRotation=(targ)=>{
    targ.style.transform="rotateY("+globalYrotation+"deg) rotateX("+globalXrotation+"deg)";
   }

   const rotationManager=(hour,minute,format24)=>{
    let h=hour;
    let m=minute;
    let b=24;
    if(!format24){
     b=12;
     h=hour%b;
    }
    return (-90+((h/b)*360)+(((m/60)/b)*360));
   }

   const dataSliceConsumer=(sliceArray,diamater,format24)=>{
    let slicesScripts="";
    sliceArray.forEach((sliceData)=>{
     let start=resolveISO8601(sliceData.startDateTime);
     let end=resolveISO8601(sliceData.endDateTime);
     let timeDelta= end.day>=start.day?((end.hour-start.hour)*60)+(end.min-start.min):(((end.hour+12)-start.hour)*60)+(end.min-start.min);
     slicesScripts+=sliceGenerator(
      diamater,
      rotationManager(start.hour,start.min,format24),
      timeDelta*diamater*Math.PI/2/(format24?1440:720),
      sliceData.backGroundColor,
      sliceData.lable)+"\n";
    });
    return {
     slices:slicesScripts
    }
   }

   const circleMaker=(diamater,radius,color,opacity,name)=>{
     return ("<circle "+
             "name='"+name+"' "+
             "r='"+radius+"' "+
             "cx='"+diamater/2 +"' "+
             "cy='"+diamater/2 +"' "+
             "fill='"+color+"' "+
             "style='fill-opacity:"+opacity+";' "+
             ""+
             "/>");
   }

   const linesAndLablesMaker=(diamater,format24)=>{
    const dialNumMaker=()=>{
     let res="";
     let radius=(diamater/2)-(diamater/25);
     let b=format24?24:12;
     for(let i=0;i<b;i++){
      let xPoint=(radius)*Math.sin((i*(360/b))*(Math.PI/180));
      let yPoint=(radius)*Math.cos((i*(360/b))*(Math.PI/180));
      res+=
           "<circle "+
           " name='watchDecorationsmall' "+
           " r='"+diamater/30+"' "+
           " cx='"+(xPoint+(diamater/2))+"' "+
           " cy='"+(yPoint+(diamater/2))+"' "+
           "/>"+
           "<text "+
           " style='font:bold "+diamater/21+"px Arial;fill: white' "+
           " dx='-"+(diamater/50)+"' "+
           " dy='"+diamater/60+"' "+
           " x='"+(xPoint+(diamater/2))+"' "+
           " y='"+(yPoint+(diamater/2))+"' "+
           ">"+(b-((i+(b/2))%b))+"</text>";
     }
     return res;
    }
    return ("<circle "+
            "name='watchDecorationMain' "+
            "r='"+diamater/4+"' "+
            "cx='"+diamater/2+"' "+
            "cy='"+diamater/2+"' "+
            "style='"+
                  "fill-opacity:0.0; "+
                  "transform-origin:center; "+
                  "transform:rotate(-0.2deg); '"+
            "stroke='white' "+
            "stroke-width='"+diamater/2+"' "+
            "stroke-dasharray='"+2*((diamater*Math.PI/2)/(!format24?1440:2880))+" "+(118)*((diamater*Math.PI/2)/(!format24?1440:2880))+"' "+
            "/>"+
            "<circle "+
            "name='watchDecorationsmall' "+
            "r='"+diamater/2.5+"' "+
            "cx='"+diamater/2+"' "+
            "cy='"+diamater/2+"' "+
            "style='"+
                  "fill-opacity:0.0; '"+
            "stroke='white' "+
            "stroke-width='"+diamater/16+"' "+
            "stroke-dasharray='"+1*((diamater*Math.PI/2)/(!format24?1440:2880))+" "+(23)*((diamater*Math.PI/2)/(!format24?1440:2880))+"' "+
            "/>"+
            dialNumMaker());
   }

   const resolveISO8601=(timeString)=>{
    const sec1=timeString.split("T");
    const sec2=sec1[0].split("-");
    const sec3=sec1[1].split("+");
    const sec4=sec3[0].split(":");
    return {
     fullDate:sec1[0],
     year:parseInt(sec2[0]),
     month:parseInt(sec2[1]),
     day:parseInt(sec2[2]),
     fullTime:sec1[1],
     fullTimeLocal:sec3[0],
     fullTimeOffset:sec3[1],
     hour:parseInt(sec4[0]),
     min:parseInt(sec4[1]),
     sec:parseInt(sec4[2])
    }
   }

   const clockView=(diamater,foramt24)=>{
    //repeat-example: setTimeout(function(){contentMng(n)},((Math.floor(Math.random()*5))+10)*1000)
    const d = new Date();
    let rotation=rotationManager(d.getHours(),d.getMinutes(),foramt24);
    return (
     "<circle "+
       "name='clockHand' "+
       "r='"+diamater/8+"' "+
       "cx='"+diamater/2+"' "+
       "cy='"+diamater/2+"' "+
       "style='"+
             "fill-opacity:0.0; "+
             "transform-origin:center; "+
             "transform:rotate("+rotation+"deg); '"+
       "stroke='red' "+
       "stroke-width='"+diamater/2+"' "+
       "stroke-dasharray='"+diamater*Math.PI/720+" "+diamater*Math.PI+"' "+
       "stroke-opacity='1'"+
     "/>"+
     circleMaker(diamater,diamater/8,"black",1,"centerclock")+
     "<text "+
            " style='"+
                   "font:bold "+diamater/35+"px Arial;"+
                   "fill: white ;"+
                   "transform-origin:center; "+
                   "transform:rotate("+0+"deg); '"+
            " dx='-"+(diamater/15)+"' "+
            " dy='"+(diamater/50)+"' "+
            " x='"+((diamater/2))+"' "+
            " y='"+((diamater/2))+"' "+
            ">"+d.toLocaleTimeString()+  
     "</text>"+
     "<text "+
            " style='"+
                   "font:bold "+diamater/40+"px Arial;"+
                   "fill: white ;"+
                   "transform-origin:center; "+
                   "transform:rotate("+0+"deg); '"+
            " dx='-"+(diamater/16)+"' "+
            " dy='-"+(diamater/100)+"' "+
            " x='"+((diamater/2))+"' "+
            " y='"+((diamater/2))+"' "+
            ">"+d.toLocaleDateString()+
     "</text>"
    );
   }

   const sliceGenerator=(diamater,rotation,duration,bgColor,name)=>{
    const circomfrence=diamater*Math.PI;
    return ("<circle "+
            "name='"+name+"' "+
            "r='"+diamater/4+"' "+
            "cx='"+diamater/2+"' "+
            "cy='"+diamater/2+"' "+
            "style='"+
                  "fill-opacity:0.1; "+
                  "transform-origin:center; "+
                  "transform:rotate("+rotation+"deg); '"+
            "stroke='"+bgColor+"' "+
            "stroke-width='"+diamater/2+"' "+
            "stroke-dasharray='"+duration+" "+diamater*Math.PI+"' "+
            "stroke-opacity='0.5'"+
            "/>"+
            "<text "+
            " style='"+
                   "font:bold "+diamater/40+"px Arial;"+
                   "fill: white ;"+
                   "transform-origin:center; "+
                   "transform:rotate("+rotation+"deg); '"+
            " dx='"+(diamater/4.5)+"' "+
            " dy='"+diamater/30+"' "+
            " x='"+((diamater/2))+"' "+
            " y='"+((diamater/2))+"' "+
            ">"+name+"</text>");
   };

   const getData=()=>{
     let incoming = null;
     if(incoming===null)incoming=demoData;
     incoming.instances.sort((a,b)=>{
      a.startDateTime<a.endDateTime?1:-1;
     });
     for(let i=0;i<incoming.instances.length;i++){
      incoming.instances[i]={...incoming.instances[i], index:i};
     }
     /*
      psudo:
      create new sotred object then give object a z-index property and return
     */
    return incoming;
   }

   const setComponentID=()=>{
    let maxKey=0;
    Array.prototype.forEach.call(document.getElementsByClassName("sectograph"),(e)=>{
      if(e.getAttribute(gsectokey)!==null)
       if(parseInt(e.getAttribute(gsectokey))>maxKey)
        maxKey=parseInt(e.getAttribute(gsectokey));
    });
    return {
     name:"sectograph-"+(maxKey+1),
     key:(maxKey+1)
    }
   }

   let rotationInterval=null;

   const classChangerLeave=(e)=>{
    rotationInterval=setInterval(()=>{elementTimeRotation();elementActualTimeRotation(document.getElementById(e.id))},1000);
   }
   
   const classChangerEnter=(e)=>{
    clearInterval(rotationInterval);
    e.style.transform="rotateY("+0+"deg) rotateX("+0+"deg)";
   }

   const test=()=>{};


//customStufff-------------------------------------------------------------------------------------------------/\


    let tmpl = document.createElement('template');
    tmpl.innerHTML = genStyle();//<-----------------------custom-----------------------------------------------<<
    tmpl.appendChild(mkGraph());//<-----------------------custom-----------------------------------------------<<

    customElements.define('com-sap-sample-helloworld1', class HelloWorld1 extends HTMLElement {
		constructor() {
			super(); 
			this._shadowRoot = this.attachShadow({mode: "open"});
                        this._shadowRoot.appendChild(tmpl.content.cloneNode(true));
		}

        //Fired when the widget is added to the html DOM of the page
        connectedCallback(){
        }

         //Fired when the widget is removed from the html DOM of the page (e.g. by hide)
        disconnectedCallback(){
        
        }

         //When the custom widget is updated, the Custom Widget SDK framework executes this function first
	onCustomWidgetBeforeUpdate(oChangedProperties) {

	}

        //When the custom widget is updated, the Custom Widget SDK framework executes this function after the update
		onCustomWidgetAfterUpdate(oChangedProperties) {
            this.redraw();
        }
        
        //When the custom widget is removed from the canvas or the analytic application is closed
        onCustomWidgetDestroy(){
        }

        
        //When the custom widget is resized on the canvas, the Custom Widget SDK framework executes the following JavaScript function call on the custom widget
        // Commented out by default
        /*
        onCustomWidgetResize(width, height){
        }
        */

        redraw(){}
    });
})();