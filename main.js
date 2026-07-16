let scene = "title";


const app = document.getElementById("app");



function render(){


    app.innerHTML = "";



    if(scene === "title"){

        showTitle();

    }


}



function showTitle(){


    app.innerHTML = `

        <div class="title">

            <h1>
            エラッタオリジナリティ
            </h1>


            <button onclick="goMenu()">
            START
            </button>


        </div>

    `;


}



function goMenu(){


    scene = "menu";

    render();


}



render();
