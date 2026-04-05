const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log("\n🚀 Smart Environment File Generator", "blue");
  log("=====================================\n", "blue");

  const turboJsonPath = path.join(__dirname, "..", "turbo.json");

  if (!fs.existsSync(turboJsonPath)) {
    log("❌ turbo.json not found!", "red");
    process.exit(1);
  }

  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, "utf-8"));
  const allEnv = turboJson.globalEnv || [];

  const categorized = {
    backend: [],
    web: [],
    extension: [],
  };

  allEnv.forEach((variable) => {
    if (variable.startsWith("VITE_")) {
      categorized.extension.push(variable);
    } else if (variable.startsWith("NEXT_PUBLIC_")) {
      categorized.web.push(variable);
    } else {
      categorized.backend.push(variable);
    }
  });

  log(`📊 Categorized ${allEnv.length} variables:`, "cyan");
  log(`   Backend:   ${categorized.backend.length} variables`, "green");
  log(`   Web:       ${categorized.web.length} variables`, "green");
  log(`   Extension: ${categorized.extension.length} variables\n`, "green");

  const apps = [
    {
      name: "Backend",
      folder: path.join(__dirname, "..", "apps", "backend"),
      variables: categorized.backend,
    },
    {
      name: "Web",
      folder: path.join(__dirname, "..", "apps", "web"),
      variables: categorized.web,
    },
    {
      name: "Extension",
      folder: path.join(__dirname, "..", "apps", "extension"),
      variables: categorized.extension,
    },
  ];

  let created = 0;
  let skipped = 0;

  log("📝 Creating .env files...\n", "blue");

  apps.forEach((app) => {
    if (!fs.existsSync(app.folder)) {
      log(`⚠️  ${app.name}: Folder not found`, "yellow");
      return;
    }

    const envPath = path.join(app.folder, ".env");

    if (fs.existsSync(envPath)) {
      log(`⏭️  ${app.name}: .env already exists (skipped)`, "yellow");
      skipped++;
      return;
    }

    const lines = ["# Environment Variables for " + app.name];
    lines.push('# Replace "enter_your_value" with actual values\n');

    if (app.variables.length === 0) {
      lines.push("# No variables defined for this app");
    } else {
      app.variables.forEach((variable) => {
        lines.push(`${variable}=enter_your_value`);
      });
    }

    const envContent = lines.join("\n");

    try {
      fs.writeFileSync(envPath, envContent, "utf-8");
      log(
        `✅ ${app.name}: .env created with ${app.variables.length} variables`,
        "green"
      );
      created++;
    } catch (error) {
      log(`❌ ${app.name}: Error creating .env - ${error.message}`, "red");
    }
  });

  log("\n✨ Environment file generation complete!", "green");
  log(`\n📊 Summary:`, "cyan");
  log(`   Created: ${created}`, "green");
  log(`   Skipped: ${skipped}`, "yellow");
  log(`   Total variables: ${allEnv.length}\n`, "cyan");

  log("📋 Variable Breakdown:", "cyan");
  log(`   Backend:   ${categorized.backend.length}`, "green");
  log(`   Web:       ${categorized.web.length}`, "green");
  log(`   Extension: ${categorized.extension.length}\n`, "green");
}

main();
