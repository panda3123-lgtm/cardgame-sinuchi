// =================================
// エラッタオリジナリティ
// profile.js
// =================================


// プロフィールデータ

let profileData = {

    name: "プレイヤー",

    icon: "default.png",

    title: "初心者"

};



let profileMaster = {

    icons: [],

    titles: []

};




// =================================
// 初期化
// =================================


async function loadProfileData(){


    try{


        const response =
        await fetch("profile.json");


        profileMaster =
        await response.json();



        loadSavedProfile();


        renderProfile();



    }

    catch(error){


        console.error(
            "プロフィールデータ読み込み失敗",
            error
        );


    }


}






// =================================
// 保存データ読み込み
// =================================


function loadSavedProfile(){


    const saved =

    localStorage.getItem(
        "errataProfile"
    );



    if(saved){


        profileData =
        JSON.parse(saved);


    }


}







// =================================
// 表示
// =================================


function renderProfile(){



    const nameArea =

    document.getElementById(
        "player-name"
    );



    const titleArea =

    document.getElementById(
        "player-title"
    );



    const iconArea =

    document.getElementById(
        "player-icon"
    );




    if(nameArea)

        nameArea.textContent =
        profileData.name;



    if(titleArea)

        titleArea.textContent =
        profileData.title;



    if(iconArea){


        iconArea.innerHTML = `

        <img
        src="images/${profileData.icon}"
        width="60">

        `;


    }



    renderIconList();

    renderTitleList();



}






// =================================
// アイコン一覧
// =================================


function renderIconList(){


    const area =

    document.getElementById(
        "icon-list"
    );



    if(!area)return;



    area.innerHTML="";



    profileMaster.icons.forEach(icon=>{


        const button =

        document.createElement(
            "button"
        );



        button.innerHTML = `

        <img
        src="images/${icon}"
        width="50">

        `;



        button.onclick=()=>{


            profileData.icon = icon;


            saveProfile();


        };



        area.appendChild(button);



    });



}






// =================================
// 称号一覧
// =================================


function renderTitleList(){



    const area =

    document.getElementById(
        "title-list"
    );



    if(!area)return;



    area.innerHTML="";



    profileMaster.titles.forEach(title=>{


        const button =

        document.createElement(
            "button"
        );



        button.textContent =
        title;



        button.onclick=()=>{


            profileData.title =
            title;


            saveProfile();


        };



        area.appendChild(button);



    });


}






// =================================
// 名前変更
// =================================


function changePlayerName(){



    const name =

    prompt(
        "プレイヤー名を入力してください"
    );



    if(name){


        profileData.name =
        name;


        saveProfile();


    }


}







// =================================
// 保存
// =================================


function saveProfile(){



    localStorage.setItem(

        "errataProfile",

        JSON.stringify(
            profileData
        )

    );



    renderProfile();



}







// 起動

loadProfileData();
