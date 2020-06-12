const config = require('config');

const puppeteer = require('puppeteer-extra');

const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: 'f804e7fb453a6117f3df546b9aaa054d' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
        },
        visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    }),
    StealthPlugin()
)

const sites = config.get('sites');
const singleMode = config.get('singleMode');
const playerName = config.get('playerName');

const reCaptchaExtensionPath = require('path').join(__dirname, 'extensions/reCaptch-solver');

var extensionBackgroundPage;

const chromeSettings = {
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: [
        `--disable-extensions-except=${reCaptchaExtensionPath}`,
        `--load-extension=${reCaptchaExtensionPath}`
        //  '--user-data-dir=C:\\users\\Loai Arkam\\AppData\\Local\\Chrome'
        //  `--proxy-server= http://159.203.44.118:8080`
    ]
};

(async () => {

    const browser = await puppeteer.launch(chromeSettings)
    const targets = await browser.targets();
    const extensionBackgroundTarget = targets.find(target => target.type() === 'background_page');
    extensionBackgroundPage = await extensionBackgroundTarget.page();
    extensionBackgroundPage.evaluate(settings => {

        setOptions(settings);

    }, config.get('captcha'))

    for (let index = 2; index < sites.length; index++) {
        singleMode ? await vote(browser, sites[index]) : vote(browser, sites[index]);
    }

})();

async function vote(browser, site) {
    return new Promise(function (resolve, reject) {
        var page;

        newPage(browser, site)
            .then(result => page = result)
            .then(_ => sleep(500))
            .then(_ => inputName(page, site))
            .then(_ => sleep(500))
            .then(_ => selectOptions(page, site))
            .then(_ => sleep(500))
            .then(_ => solveCaptcha(page))
            .then(_ => sleep(500))
            //.then(_ => resolve(page))
            .catch(error => console.log(error))

    })
}

async function newPage(browser, site) {
    var page;
    return new Promise(function (resolve, reject) {
        browser.newPage()
            .then(result => {
                page = result;
                return Promise.all([
                    page.waitForNavigation({ timeout: 120000 }),
                    page.waitForSelector(site.inputSelector, { timeout: 120000 }),
                    page.goto(site.url, { timeout: 120000 }),
                ])
            })
            .then(_ => resolve(page))
            .catch(error => reject(error))
    })
}
async function inputName(page, site) {
    var inputField;

    return new Promise(function (resolve, reject) {
        page.$(site.inputSelector)
            .then(result => inputField = result)
            .then(_ => inputField.click())
            .then(_ => sleep(500))
            .then(_ => site.clearText ? clearText(inputField, page) : inputField)
            .then(_ => inputField.type(playerName, { delay: 200 }))
            .then(_ => resolve(page))
            .catch(error => reject(error))
    })
}

async function selectOptions(page, site) {
    var selectInput;

    return new Promise(function (resolve, reject) {
        if (site.select) {
            page.$(site.select)
                .then(result => selectInput = result)
                .then(_ => selectInput.click())
                .then(resolve())
                .catch(error => reject(error))
        }
        else {
            resolve()
        }
    })
}

async function solveCaptcha(page) {
    console.log("solving")
}

function sleep(duration, value) {
    value = value || true;
    //console.log("sleeping")
    return new Promise(function (resolve, reject) {
        setTimeout(() => resolve(value), duration);
    })
}

async function clearText(element, page) {
    return new Promise(function (resolve, reject) {
        page.keyboard.down('Shift')
            .then(_ => page.keyboard.press('KeyA'))
            .then(_ => page.keyboard.up('Shift'))
            .then(_ => page.keyboard.press('Backspace'))
            .then(_ => resolve(element))
            .catch(error => reject(error))
    })
}