// ==UserScript==
// @name         Nicovideo check is user followed for multiple Accounts
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.nicovideo.jp/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nicovideo.jp
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Your Accounts here... {name:id,...}
    const Accounts = { samchiu90: `39639886`, samchiujp: `93438854`, samchiu9090: `97637163`, samchiu_ctss90: `118415771` };

    const fetchFollowers = async (targets = {}) => {
        let ReturnList = {};
        console.log(`Start fetching`);
        for (let i in Object.entries(targets)) {
            let acc = Object.entries(targets)[i];
            console.log(`fetching ${acc[0]} : ${acc[1]}`);
            await fetch(`https://nvapi.nicovideo.jp/v1/users/${acc[1]}/following/users?pageSize=1000`, {
                "headers": {
                    "accept": "*/*",
                    "x-frontend-id": "6",
                    "x-frontend-version": "0",
                    "x-niconico-language": "ja-jp"
                },
                "referrer": "https://www.nicovideo.jp/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            }).then(res => res.json())
                .then(data => ReturnList[acc[0]] = data)
                .then(() => console.log(`fetched ${acc[0]} : ${acc[1]}`));
        }
        console.log(`Finish fetching`);
        //console.log(`ReturnList: ${JSON.stringify(ReturnList)}`);
        return ReturnList;
    }

    const Export = async (list = [], name = '') => {

        const blob = new Blob([JSON.stringify(list)], { type: 'application/json' });
        const href = await URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `${name}_list.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ExportFollowers = async () => {
        const list = await fetchFollowers(Accounts);
        //console.log(`list: ${JSON.stringify(list)}`);
        const { samchiu90, samchiujp, samchiu9090, samchiu_ctss90 } = await list;
        samchiu90?.data?.items && Export(samchiu90?.data?.items, 'samchiu90');
        samchiujp?.data?.items && Export(samchiujp?.data?.items, 'samchiujp');
        samchiu9090?.data?.items && Export(samchiu9090?.data?.items, 'samchiu9090');
        samchiu_ctss90?.data?.items && Export(samchiu_ctss90?.data?.items, 'samchiu_ctss90');
    }

    const FindUser = async (id = '') => {
        console.log(`FindUser ${id}`);
        const lists = await fetchFollowers(Accounts);
        let IsFollowing = {};
        Object.keys(lists).forEach(
            userName => {
                userName && lists[userName].data.items.forEach(
                    following => {
                        if (String(following.id) === String(id)) {
                            IsFollowing[userName] = true;
                        }
                    }
                );
            }
        );
        return IsFollowing;
    }

    const FindDuplicate = async () => {
        let All = [];
        const lists = await fetchFollowers(Accounts);
        Object.keys(lists).forEach(
            userName => {
                All.push(...(lists[userName].data.items));
            }
        );
        let DuplicateId = {};
        All.forEach(
            user => {
                let self = All.filter(u => u.id === user.id);
                if (self.length > 1) {
                    DuplicateId[String(user.id)] = {};
                    DuplicateId[String(user.id)].link = `https://www.nicovideo.jp/user/${user.id}`;
                    DuplicateId[String(user.id)].nickname = user?.nickname;
                    Object.keys(lists).forEach(
                        userName => {
                            DuplicateId[String(user.id)][userName] = false;
                            userName && lists[userName].data.items.forEach(
                                following => {
                                    if (following.id === user.id) {
                                        //console.log(userName,DuplicateId[String(user.id)].nickname, following.id, user.id);
                                        DuplicateId[String(user.id)][userName] = true;
                                    }
                                }
                            );
                        });
                }
            }
        );
        return DuplicateId;
    }
    const FindDuplicateForAcc = (ac = '') => {
        let DuplicateIdsForAcc = Object.values(FindDuplicate()).filter(
            DuplicateId => DuplicateId[ac]
        );
        DuplicateIdsForAcc.forEach(user => console.log(`${user.nickname} ${user.link}`));
        console.table(DuplicateIdsForAcc);
        return DuplicateIdsForAcc;
    }

    var FollowText = document.createElement("SPAN");
    let Styles = document.createAttribute("style");
    Styles.value = 'padding-inline:0.5rem';
    FollowText.setAttributeNode(Styles);

    window.addEventListener("load", async (e) => {
        // All resources finished loading!
        let path = window.location.pathname.split('/');
        console.table(path);
        const genText = async (id = '') => {
            let result = await FindUser(id);
            console.table(result);
            let FollowingAc = 'Following: ';
            Object.keys(result).forEach(k => FollowingAc += result[k] ? `${k}, ` : '');
            return FollowingAc;
        }
        if (path[1] === 'user') {
            let currentId = path[2];
            let FollowingAc = await genText(currentId);
            FollowText.appendChild(document.createTextNode(FollowingAc));
            document.getElementsByClassName('UserDetailsStatus')[0].appendChild(FollowText);
        } else if (path[1] === 'watch') {
            let uploaderPath = document.getElementsByClassName('Link VideoOwnerInfo-pageLink')[0].href.split('/');
            let currentId = uploaderPath[uploaderPath.length - 1];
            let FollowingAc = await genText(currentId);
            FollowText.appendChild(document.createTextNode(FollowingAc));
            document.getElementsByClassName('HeaderContainer')[0].appendChild(FollowText);
        }
    });

})();