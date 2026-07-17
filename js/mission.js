// =================================
// エラッタオリジナリティ
// mission.js
// =================================


let missions = [];

let missionProgress = {};




// =================================
// 読み込み
// =================================


async function loadMissions(){


    try{


        const response =
        await fetch("mission.json");


        missions =
        await response.json();



        loadMissionProgress();


        renderMissions();



    }
    catch(error){


        console.error(
            "ミッション読み込み失敗",
            error
        );


    }


}





// =================================
// 保存データ
// =================================


function loadMissionProgress(){


    const data =

    localStorage.getItem(
        "errataMission"
    );



    if(data){


        missionProgress =
        JSON.parse(data);


    }


}






function saveMissionProgress(){


    localStorage.setItem(

        "errataMission",

        JSON.stringify(
            missionProgress
        )

    );


}






// =================================
// 表示
// =================================


function renderMissions(){


    const area =

    document.getElementById(
        "mission-list"
    );



    if(!area)return;



    area.innerHTML="";



    missions.forEach(mission=>{


        const progress =

        missionProgress[mission.id] || 0;



        const complete =

        progress >= mission.target;



        const div =

        document.createElement(
            "div"
        );



        div.innerHTML = `

        <h3>
        ${mission.name}
        </h3>


        <p>
        ${mission.description}
        </p>


        <p>

        ${progress}
        /
        ${mission.target}

        </p>


        <p>

        ${complete ?
        "達成済み" :
        "未達成"}

        </p>

        `;



        area.appendChild(div);



    });



}







// =================================
// 進行
// =================================


function progressMission(type,value=1){


    missions.forEach(mission=>{


        if(mission.type !== type)
            return;



        if(
            missionProgress[mission.id]
            >= mission.target
        )
            return;



        missionProgress[mission.id] =
        (missionProgress[mission.id] || 0)
        + value;



        if(
            missionProgress[mission.id]
            >= mission.target
        ){

            unlockReward(
                mission.reward
            );

        }



    });



    saveMissionProgress();


    renderMissions();


}







// =================================
// 報酬
// =================================


function unlockReward(reward){


    alert(

    "報酬獲得！\n" +

    reward.value

    );


}





// 起動

loadMissions();

if(typeof progressMission === "function"){

    progressMission(

        "login",

        1

    );

}
