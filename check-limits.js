
console.log('Script starting...');

// This is a temporary script to check the user's API rate limits.
const apiToken = 'v^1.1#i^1#p^1#f^0#r^0#I^3#t^H4sIAAAAAAAA/+VYa2wUVRTublsexUIIBpAYsp2K4ZGZvTOzs49Ju7q0kC4p7dotlS4Cmcfddui8nLnr7pYf1irFB1R+GBMT0OIPTDAhEQTiI/yQoMEQKPYHRtGkRlECiZGgJEStd3ZL2VZCka6xiftnc88999zzfeece89c0DNj9sq+hr4bla6Z7oEe0ON2ueg5YPaM8lVzS91LyktAgYJroOeRnrLe0p9qbEFTTb4F2qah29CT0VTd5nPCWiJl6bwh2IrN64IGbR5JfDyyvpFnKMCbloEMyVAJT7S+loBCgJXYZBD6GJYLcDSW6rdsthq1hAwCTJClmRADBQb4BTxv2ykY1W0k6KiWYADDkSBIsnQrYHmO5YGPYkEgQXjaoGUrho5VKECEc+7yubVWga93d1WwbWghbIQIRyNr482RaP2aptYab4Gt8CgPcSSglD1+VGfI0NMmqCl4923snDYfT0kStG3CG87vMN4oH7nlzH24n6NaCPhh0M9K0M8l/RyARaFyrWFpArq7H55EkclkTpWHOlJQdjJGMRviNiih0VETNhGt9zh/T6QEVUkq0Kol1qyOtEdiMSIcUWEGZuOQjAkWWqvoMhlrqScF2ReQ/RxNk3JI4kJBRh7dKG9tlOYJO9UZuqw4pNmeJgOththrOJEbXwE3WKlZb7YiSeR4VKjHjXHIJJyg5qOYQp26E1eoYSI8ueHkERhbjZCliCkExyxMnMhRhGNtmopMTJzM5eJo+mTsWqITIZP3etPpNJVmKcPq8DIA0N6N6xvjUifUcLFlNKfW8/rK5AtIJQdFwrmF9XmUNbEvGZyr2AG9gwhzbJANgVHex7sVnij9m6AAs3d8RRSrQkJ+n48VfSwXZPwBRhSLUSHh0ST1On5AUciSmmB1QWSqggRJCedZSoOWIvMsl2TYYBKSsj+UJH2hZJIUOdlP0kkIAYSiKIWC/6dCuddUj0PJgqgouV60PG8JtSveDisNE3X+bk7cGFN01BjqWJ+OZgLBdbbmbTTqN0ToTFdDe+29VsMdwdepCmamFe9fDAKcWi8eCQ2GjaA8JXhxyTBhzFAVKTu9AsxaslNBuJJUFQumBDJimtHinNVFg/cPj4n7w128O+o/up/uiMp2UnZ6oXLW29iAYCqUcwNRkqF5nVo3BNx+OOKtOa+nhFvBneu0Qo1B5tEqcr7lpHJwKfsZibKgbaQs3G1TzU4H1mp0QR3fZ8gyVBVabfSU61nTUkgQVTjdCrsICa4I0+yypQOc30/j3sk3JVxS7irdOt2OpGIcxWW9rqpJ8bdAQdWmF3bTMuSU5PSY/8Ing3f8A0a4JPeje12fgF7XCbfLBWrAMroaVM0o3VBW+sASW0GQUoQkZSsdOv4utyDVBbOmoFjuBSXn5jbKzzU0/tojpo4/ef2xYEllwfvJwGaweOwFZXYpPafgOQU8fHumnJ63qJLhQJClAcuxwJcA1bdny+iFZQ+eHcl6ds2yLrQPzz+W/vmP0+8LFd+ByjEll6u8BAe7xOo4cJI48OfO4e2fkhFx0dE94UXnT3341Lrn4/v63t2ezaz4rW37pa9R/IebnZcTK17uO3bx9f7M8O6dx0mqt/6bevfeTcKuj+aFvqoeeW3phR2H6t5cXU2vbIstP7mh4tGSzS+c5IY+3/IefeXg4n0ie6JqE3njzJ6BoSsjF0cespbt/vKd/a/SVy8vX8h3z1y1W9a75h2sefyXHU+fWnJuPvjsyO/Pui8IL55ItMtH3tpV0bauU41uufT2S19s3Ptt91B3uOJUpmquOXj4jK4nYix9bebNBZnTI4PdZde/n9V09fwrvW7y0I8fpENN7KVB843+m0fFam3Hx9fOcsuGtu0fbjm8bc3Swf58LP8CzEjpW9kSAAA=';
const url = 'https://api.ebay.com/developer/analytics/v1/user_rate_limit/';

async function checkLimits() {
    console.log('Checking API rate limits...');
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json',
            },
        });

        console.log(`Response status: ${response.status}`);
        const responseBody = await response.text();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`);
        }

        console.log('\n--- SUCCESS ---');
        console.log('Received API limit data:');
        console.log(JSON.stringify(JSON.parse(responseBody), null, 2)); // Parse then pretty-print

    } catch (error) {
        console.error('\n--- ERROR ---');
        console.error('An error occurred during the limit check:', error);
    }
    console.log('Script finished.');
}

checkLimits();
