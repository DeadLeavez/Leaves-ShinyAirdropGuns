# Shiny Airdrop Guns
Gives a chance for the weapons found in the weapon crates inside airdrops to be special editions with better stats.

By default they have higher fire-rate, better ergo, more durability, less recoil, and a cool background color. The exact numbers can be tweaked in the config file.

The list of weapons are the ones I personally felt fit, but you can add more if you'd like.

# Changelog
## 1.0.0
Initial Release

## 1.0.1
- Fixed integrated barrel weapons being wildly inaccurate.

## 1.0.2
- Fixed localization (for EN).
- Added STM 9 (makes it full auto)
- Allows prefix/suffix on the name of the weapon.
- Added setting to allow blacklisting it from spawning as a naked gun inside airdrops. (you still get them from the sealed crates as intended)

## 1.0.3
- Made the new guns compatible with quests that require the original gun. For example, you can use a shiny m4a1 in peacekeeping mission.

## 1.0.4
- Fix for crash in 3.7.1
## 1.0.4 hotfix

While last release wont crash or cause any issues. The blacklist didn't work properly. Here's a hotfix, this only matters if you have the
```
"blacklistFromAirdrop": true,
```
enabled.

## 1.0.5
- Added masteries to the guns. They share the same masteries as their original weapon.

## 1.0.6
Fixed:
- Shotguns not working ( WHY WOULD YOU DO THIS BSG!? )
- Removed durability from config, cus it didnt work.


Added:
- Saiga 12 to default guns
- The ability to give low-firerate guns an extra boost ( < 100 default fire rate )

## 1.0.7
Version by MusicManiac

- Fixed weapons being incorrect category
- Fixed weapons missing from handbook
- Added more config options
- Added VSS VAL to list of shiny guns that spawn by default

## 1.0.8
Version by MusicManiac

Fixed short name displaying full name. Also means killfeed mods (such as Amands's Hitmarker ) will look much better when using shiny guns

## 2.0.0
Version 2.0.0 For 3.8.0 release.

MAJOR OVERHAUL OF MOD.

The mod now allow multiple sections of guns. Each section can be customized independently.

Added many new features, all which are explain in detail in the config.

## 2.0.1

- Fix addToSpecialSlots property of weapon groups. This was being ignored and all weapons could be added to special slots.

## 2.1.0

- Update to 3.9.0
- Change name of folder and name in package.json to follow standards.

## 2.1.1
- Update to 3.10.0
- item IDs have changed, and they can be found in the ``ids.jsonc`` file in the ``config`` directory. They will be generated on the fly if missing. 
- Weapon groups can have weighting (technically not new, but wasn't mention.) useful if you want to do things like "rarity tiers"
- Ensure that guns don't get invalid properties that might be present in the config. Edge case.

## 2.1.2
- Add G36 to default guns config.
- Add 15% reduced durability burn on ARs making them slightly more durable.
- Add compatibility with Leaves Questrandomizer. Adding all the shiny guns to be equivalents to all non-shiny for quest purposes. See Questrandomizer documentation if you want to do this for your own weapon mods.
- Added config option to blacklist the guns from fence. (Enabled by default)

### TODO
- Make the quest thing not crash if quests have fucked up data.