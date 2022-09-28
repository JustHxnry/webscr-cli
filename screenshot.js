#!/usr/bin/env node

const chalk = require('chalk');
const rl = require('readline');
const args = process.argv;

const randoms = require('@justhxnry/randoms');
const puppeteer = require('puppeteer');
const axios = require('axios').default;

// usage function
const usage = function() {
    const usageText = `
    Web Screenshot CLI is tool for taking screenshot of the website and getting sharable link

    usage:
        webscr

        url needs to start with http:// or https://

    `;

    console.log(usageText);
};

// function to log errors with red text
function errorLog(error) {
    const eLog = chalk.red(error);
    console.log(eLog);
};

// function to log successful message
function successLog(url) {
    const sLog = chalk.whiteBright(`Screenshot link: `) + chalk.greenBright(url);
    console.log(sLog);
};

// function to fullfil prompts
function prompt(question) {
    const r = rl.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    return new Promise((resolve, reject) => {
        try {
            r.question(question, answer => {
                r.close();
                resolve(answer);
            });
        } catch (e) {
            reject(e);
        }
    });
};

// function to upload file to the server
async function uploadScr(b64) {
    const formData = require('form-data');

    const form = new formData();

    const fileName = randoms.randomString(10) + ".png";

    form.append('file', b64, fileName);

    try {
        const response = await axios.post("https://files.hxnrycz.xyz/", form, {
            ...form.getHeaders()
        });

        if (response.status == 200 || response.status == 201) {
            return successLog(response.request.res.responseUrl);
        };

        errorLog(`Error at files.hxnrycz.xyz file processing`);
        return usage();
    } catch (e) {
        errorLog(`Error: ${e}`);
        return usage();
    }

};

async function screenshot(url, options) {

    const browser = await puppeteer.launch({
        defaultViewport: options,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url);
    const scr64 = await page.screenshot({ type: "png" });

    await uploadScr(scr64);

    await browser.close();

};

if (args.length >= 3) return usage();

if (args.length == 2) {
    let q = chalk.blue(`Type in url: `);
    let options = {};
    prompt(q).then(url => {
        if (!url) {
            errorLog(`URL is required argument`);
            return usage();
        };

        options.url = url;

        q = chalk.blue(`Type in screen width (default: 800): `);
        prompt(q).then(width => {
            options.width = typeof Number(width) == 'number' ? Number(width) : 800;

            q = chalk.blue(`Type in screen height (default: 600): `);
            prompt(q).then(height => {
                options.height = typeof Number(height) == 'number' ? Number(height) : 600;

                q = chalk.blue(`Screenshot with android web view? (default: no): `);
                prompt(q).then(mwv => {
                    if (!mwv) mwv = "no";
                    if (['yes', 'no'].indexOf(mwv.toLowerCase()) == -1) {
                        errorLog(`You cant answer with "${mwv}". Options are: ['yes', 'no']`);
                        return usage();
                    };

                    options.isMobile = mwv.toLowerCase() == 'yes' ? true : false;

                    screenshot(url, options);
                });
            });
        });
    });
};