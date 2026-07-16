function battle(attacker, defender, attackerOwner, defenderOwner){

    //モンスター同士

    if(defender){

        if(attacker.atk > defender.atk){

            let damage = attacker.atk - defender.atk;

            defenderOwner.lp -= damage;

            destroyCard(defender, defenderOwner);

        }

        else if(attacker.atk < defender.atk){

            let damage = defender.atk - attacker.atk;

            attackerOwner.lp -= damage;

            destroyCard(attacker, attackerOwner);

        }

        else{

            destroyCard(attacker, attackerOwner);
            destroyCard(defender, defenderOwner);

        }

    }


    //直接攻撃

    else{


    if(canDirectAttack(defenderOwner)){


        defenderOwner.lp -= attacker.atk;


        console.log(
            attacker.name + "の直接攻撃"
        );


    }
    else{


        console.log(
            "相手モンスターが存在するため直接攻撃不可"
        );


    }

}

    }

}



function destroyCard(card, owner){

    let index = owner.field.indexOf(card);


    if(index !== -1){

        owner.field.splice(index,1);

    }


    owner.graveyard.push(card);

}

// カード破壊処理

function destroyCard(card, owner, reason){

    // 効果破壊の場合

    if(reason === "effect"){

        if(card.effectDestroyImmune){

            console.log(
                card.name + "は効果破壊されない"
            );

            return;

        }

    }


    let index = owner.field.indexOf(card);


    if(index !== -1){

        owner.field.splice(index,1);

    }


    owner.graveyard.push(card);


    console.log(
        card.name + "を墓地へ送った"
    );

}
{

    let index = owner.field.indexOf(card);


    if(index !== -1){

        owner.field.splice(index,1);

    }


    owner.graveyard.push(card);


}



// LP確認

function checkWin(player1, player2){


    if(player1.lp <= 0){

        return player2.name + "の勝利";

    }


    if(player2.lp <= 0){

        return player1.name + "の勝利";

    }


    return null;


}


// 攻撃可能チェック

function canAttack(card){

    // SA持ちなら召喚ターンでも攻撃可能
    if(card.sa){

        return true;

    }


    // 召喚ターンなら攻撃不可
    if(card.summonedTurn === true){

        return false;

    }


    // それ以外は攻撃可能
    return true;

}



// 攻撃後の処理

function afterAttack(card){

    card.attacked = true;

}



// ターン開始時のリセット

function resetAttack(player){

    for(let card of player.field){

        card.attacked = false;
        card.summonedTurn = false;

    }

}

// ブロッカー処理

function checkBlocker(attacker, target, enemyField){

    // すでに攻撃対象がブロッカーならそのまま

    if(target && target.blocker){

        return target;

    }


    // 場にいるブロッカーを探す

    for(let card of enemyField){

        if(card.blocker){

            // 攻撃側がブロッカー無効を持っている場合
            if(attacker.blockerIgnore){

                continue;

            }


            return card;

        }

    }


    // ブロッカーなし

    return target;

}

// 直接攻撃可能か確認

function canDirectAttack(defenderPlayer){

    // 相手の場にモンスターがいるなら不可

    if(defenderPlayer.field.length > 0){

        return false;

    }


    return true;

}


// トラップセット

function setTrap(card, player){

    player.trapZone.push(card);

    console.log(
        card.name + "をセット"
    );

}



// トラップ発動確認

function activateTrap(trigger, player, enemy){

    for(let i = player.trapZone.length - 1; i >= 0; i--){

        let trap = player.trapZone[i];


        // 条件確認
        if(checkTrapCondition(trap, trigger)){


            player.trapZone.splice(i,1);


            player.graveyard.push(trap);


            console.log(
                trap.name + "を発動"
            );


            return trap;

        }

    }


    return null;

}



// トラップ条件

function checkTrapCondition(trap, trigger){

    // ここは後でカードごとに拡張

    return false;

}
