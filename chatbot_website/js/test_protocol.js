/**
/**
Library for creating a dialogue test environment
**/

const call_middleware = async function (move) {
  // $.ajaxSetup({
  //     url: 'http://localhost:3000',
  //     crossDomain: true,
  //     xhrFields: {
  //         withCredentials: true
  //     }
  // });

  let data = {
    move: move,
    flag: "test",
  };

  try {
    // let result = await $.post("http://localhost:3000/dialogue/argql/moves", data, );

    let result = $.ajax({
      // url: "http://middleware.arg.tech/dialogue/argql/moves",
      url: "http://localhost:8075/dialogue/argql/moves",
      type: "POST",
      data: data,
      xhrFields: {
        withCredentials: true,
      },
    });

    console.log(typeof result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

const pad_test_dialogue = function (el) {
  let p = null;
  let dgep = null;
  let protocols = Object();
  let dialogueID = null;
  let selected_protocol = null;

  const parent = $(el);

  parent.css("text-align", "center");
  parent.html("Loading...");

  let last_used_content = -1;

  /* Names for allocating to participants */
  const names = [
    "Soraya",
    "Collette",
    "Elisa",
    "Roma",
    "Laine",
    "Merle",
    "Gerda",
    "Kirstie",
    "Violeta",
    "Hal",
    "Howard",
    "Latrisha",
    "Emilio",
    "Lawana",
    "Akilah",
    "Sandie",
    "Kathrine",
    "Sina",
    "Eliseo",
    "Krystin",
  ];

  /* Content for instantiating moves */
  // const _move_content = ["alpha",
  //                  "beta",
  //                  "charlie",
  //                  "delta",
  //                  "echo",
  //                  "foxtrot",
  //                  "golf",
  //                  "hotel"];
  const _move_content = ["BBC News article", "Daily Mail"];

  /* Function to process dialogue moves and shift to the next phase */
  const process_moves = async function (data) {
    let interactions = Object();
    let i = 0;

    let d = $("<div />");

    for (let [player, moves] of Object.entries(data)) {
      interactions[player] = Array();
      for (let move of moves) {
        let moveID = move["moveID"];
        let opener = move["opener"];
        let reply = move["reply"];
        let target = move["target"];

        let c = Array();

        console.log(reply);

        for (let [variable, content] of Object.entries(reply)) {
          console.log(content);
          if (content[0] == "$") {
            console.log(content[0] + content[1]);
            last_used_content++;
            // reply[variable] = _move_content[last_used_content];
            let response = await call_middleware(move);
            reply[variable] = response.move_text;
            c.push(variable + "=" + reply[variable]);

            opener = opener.replace("$" + variable, reply[variable]);
          } else {
            c.push(variable + "=" + content);
          }
        }

        interactions[player].push({
          moveID: moveID,
          target: target,
          reply: reply,
          speaker: player,
          dialogueID: dialogueID,
        });

        let agent_type = player.includes("Agent") ? "Agent" : "User";

        let btn = $("<button />")
          .attr("data-player", player)
          .attr("agent-type", agent_type)
          .attr("data-interaction", i)
          .addClass("move_btn")
          //       .html("Speaker: " + player +
          //             "<br />Move ID: " + moveID +
          //             "<br />Target: " + target +
          // "<br />Reply content: " + c.join(";")  +
          //             "<br />Opener: " + opener)
          .html("Speaker: " + player + "<br />Move text: " + opener)
          .click(function () {
            let p = $(this).attr("data-player");
            let i = $(this).attr("data-interaction");

            $(".move_btn").each(function () {
              $(this).prop("disabled", true);
            });

            $(this).css("background-color", "gainsboro");

            console.log(interactions[p][i]);

            dgep.dialogue_interaction(
              dialogueID,
              moveID,
              interactions[p][i],
              process_moves
            );
          });

        d.append(btn);
        i++;
      }
      parent.append(d); //.append($("<hr />"));
    }
  };

  return {
    dialogue: function () {
      let protocol_list = $("<select />").attr("id", "protocols");

      protocol_list.append(
        $("<option />").attr("value", "-1").html("Select a protocol...")
      );

      protocol_list.change(function () {
        selected_protocol = $(this).children("option:selected").val();

        let data = protocols[selected_protocol];

        let s = $("<div />");

        for (const p of data["players"]) {
          let min = "min" in p ? parseInt(p["min"]) : 0;
          let max = "max" in p ? parseInt(p["max"]) : 10;

          let num_player_sel = $("<select />")
            .attr("id", "sel_" + p["id"])
            .attr("data-player", p["id"])
            .attr("class", "num_player_sel");

          for (let i = min; i < max + 1; i++) {
            let opt = $("<option />").attr("value", i).html(i);

            num_player_sel.append(opt);
          }

          let d = $("<div />").attr("id", "div_sel_" + ["id"]);

          s.append("Number of players for player type " + p["id"] + ": ")
            .append(num_player_sel)
            .append("<br />");
        }

        let b = $("<button />")
          .html("Next &gt;&gt;")
          .click(function () {
            let used = Array();
            let participants = Array();
            $(".num_player_sel").each(function () {
              let val = $(this).children("option:selected").val();
              let player = $(this).attr("data-player");

              for (let i = 0; i < val; i++) {
                let n = Math.floor(Math.random() * names.length);

                while (true) {
                  if (used.includes(n)) {
                    n = Math.floor(Math.random() * names.length);
                  } else {
                    used.push(n);
                    break;
                  }
                }

                let name = names[n] + "(" + player + ")";
                participants.push({
                  name: name,
                  player: player,
                });
              }
            });

            console.log(participants);

            dgep.dialogue_new(
              selected_protocol,
              { participants: participants },
              (data) => {
                dialogueID = data["dialogueID"];
                console.log(dialogueID);
                console.log(data);
                dgep.dialogue_moves(dialogueID, process_moves);
              }
            );
          });

        s.append(b);
        parent.append(s);
      });

      p = pad("ws-test.arg.tech");
      dgep = p.load_module("dgep");

      p.ready(() => {
        dgep.auth_login({ username: "m", password: "p" }, (data) => {
          p.set_auth_token(data);

          dgep.protocol_list(function (data) {
            protocols = data;

            for (let [name, players] of Object.entries(data)) {
              let opt = $("<option />").attr("value", name).html(name);

              if (name === "apitest") {
                protocol_list.append(opt);
              }
              console.log(name);
              console.log(players);
            }
            parent.html("");
            parent.append(protocol_list);
          });
        });
      });
    },
  };
};
