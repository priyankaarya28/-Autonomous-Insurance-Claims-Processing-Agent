function extractFields(text) {
    const patterns = {
        policyNumber: /policy number[:\-]?\s*(\w+)/i,
        policyholderName: /policyholder name[:\-]?\s*([a-z ]+)/i,
        incidentDate: /date[:\-]?\s*([\d\/\-]+)/i,
        incidentTime: /time[:\-]?\s*([\d:]+)/i,
        location: /location[:\-]?\s*(.+)/i,
        description: /description[:\-]?\s*(.+)/i,
        claimType: /claim type[:\-]?\s*(\w+)/i,
        estimatedDamage: /estimated damage[:\-]?\s*₹?([\d,]+)/i
    };

    let fields = {};

    for (let key in patterns) {
        const match = text.match(patterns[key]);
        if (match) {
            fields[key] = key === "estimatedDamage"
                ? parseInt(match[1].replace(/,/g, ""))
                : match[1].trim();
        }
    }

    return fields;
}

function findMissingFields(fields) {
    const mandatory = [
        "policyNumber",
        "policyholderName",
        "incidentDate",
        "description",
        "claimType",
        "estimatedDamage"
    ];

    return mandatory.filter(field => !fields[field]);
}

function routeClaim(fields, missingFields) {
    const description = (fields.description || "").toLowerCase();
    const damage = fields.estimatedDamage || 0;
    const claimType = (fields.claimType || "").toLowerCase();

    if (missingFields.length > 0) {
        return {
            route: "Manual Review",
            reason: "One or more mandatory fields are missing."
        };
    }

    if (["fraud", "staged", "inconsistent"].some(word => description.includes(word))) {
        return {
            route: "Investigation Flag",
            reason: "Description contains potential fraud indicators."
        };
    }

    if (claimType === "injury") {
        return {
            route: "Specialist Queue",
            reason: "Injury claims require specialist handling."
        };
    }

    if (damage < 25000) {
        return {
            route: "Fast-track",
            reason: "Estimated damage is below ₹25,000."
        };
    }

    return {
        route: "Standard Processing",
        reason: "Claim meets standard processing criteria."
    };
}

function processClaim() {
    const text = document.getElementById("fnolText").value;

    const extractedFields = extractFields(text);
    const missingFields = findMissingFields(extractedFields);
    const routing = routeClaim(extractedFields, missingFields);

    const result = {
        extractedFields,
        missingFields,
        recommendedRoute: routing.route,
        reasoning: routing.reason
    };

    document.getElementById("output").textContent =
        JSON.stringify(result, null, 2);
}
