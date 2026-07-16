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

        defenderOwner.lp -= attacker.atk;

    }

}



function destroyCard(card, owner){

    let index = owner.field.indexOf(card);


    if(index !== -1){

        owner.field.splice(index,1);

    }


    owner.graveyard.push(card);

}
