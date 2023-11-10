## YS JsonScript

*attempts* to run the ability scripts from binoutput that are encoded in json format

this is for investigation purposes only

```
todo:
    mixins are almost entirely ignored atm bc of:
    "attatch to stateid" -> i do not know if i have to actually implement/ take into account animator states?

    hopefully not....

    child gadgets are not made though they should be
    

```

avatarId->
    depotId
        proudSkillsGroups
            proudSkillIds
                params from ProudSkillExcel
                openConfigs
                    configTalent(openConfig)
                    //these have mixins in them?
        skills
        energySkill
    configTalent
        (used for openConfig lookup)
    configAvatar
        abilities (default embryos?)
    configAbility
        the actual ability logic?

