function config() {
  let data = {
    map_numbers: "21140",
    source: "argql",
  };
  // let test = $.post("http://localhost:3000/dialogue/config", data); // Call to test initialising session in api

  let restestult = $.ajax({
    // url: "http://middleware.arg.tech/dialogue/config",
    url: "http://localhost:8075/dialogue/config",
    type: "POST",
    data: data,
    xhrFields: {
      withCredentials: true,
    },
  });
}
