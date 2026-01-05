const db = require("../database/database");
const path = require("path");
const fs = require("fs").promises;
const SkillService = require('../services/skillService');

exports.getHeroCodex = (req, res) => {
  const catId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
  const groupId = req.query.group_id ? parseInt(req.query.group_id) : null;

  // 1. Get Categories
  db.all(
    "SELECT * FROM codex_categories WHERE type = 'hero'",
    [],
    (err, categories) => {
      if (err) return res.render("error", { message: "DB Error" });

      const activeCatId =
        catId || (categories.length > 0 ? categories[0].id : null);

      // 2. Get Groups
      db.all(
        "SELECT * FROM codex_groups WHERE category_id = ?",
        [activeCatId],
        (err, groups) => {
          if (err) return res.render("error", { message: "DB Error" });

          const activeGroupId =
            groupId || (groups.length > 0 ? groups[0].id : null);

          // 3. Get Heroes
          db.all(
            "SELECT * FROM codex_heroes WHERE group_id = ?",
            [activeGroupId],
            // [Update] เปลี่ยน Callback เป็น Async เพื่อใช้ await ข้างในได้
            async (err, heroes) => {
              if (err) return res.render("error", { message: "DB Error" });

              try {
                // [Update] ใช้ Promise.all เพื่ออ่านไฟล์แบบ Parallel (ขนานกัน) แทนการรอทีละไฟล์
                const heroesData = await Promise.all(heroes.map(async (hero) => {
                  // Skill Order Parsing
                  let skillOrder = [];
                  try {
                    skillOrder = JSON.parse(hero.skill_order || "[]");
                  } catch (e) { }

                  let imageName = hero.image_name || "";
                  let folder = hero.skill_folder || imageName.replace(/\.[^/.]+$/, "");

                  let allSkills = [];
                  const skillPath = path.join(__dirname, "../public/images/skill", folder);

                  // Check logic แบบ Async
                  try {
                    // เช็คว่า Folder มีอยู่จริงไหม (stat)
                    await fs.stat(skillPath);

                    // อ่านไฟล์ใน Folder (readdir)
                    const files = await fs.readdir(skillPath);
                    allSkills = files.filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f));
                  } catch (error) {
                    // ถ้าไม่เจอ Folder หรือ Error ให้ข้ามไป (allSkills เป็น [])
                  }

                  return {
                    ...hero,
                    skillFolder: folder,
                    skillOrder: skillOrder,
                    allSkills: allSkills,
                  };
                }));

                res.render("pages/codex_hero", {
                  title: "Hero Codex",
                  categories,
                  groups,
                  heroes: heroesData,
                  activeCatId,
                  activeGroupId,
                });

              } catch (processError) {
                console.error("Error processing hero files:", processError);
                res.render("error", { message: "Server Processing Error" });
              }
            }
          );
        }
      );
    }
  );
};

exports.getPetCodex = (req, res) => {
  const catId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
  const groupId = req.query.group_id ? parseInt(req.query.group_id) : null;

  db.all(
    "SELECT * FROM codex_categories WHERE type = 'pet'",
    [],
    (err, categories) => {
      if (err) return res.render("error", { message: "DB Error" });

      const activeCatId =
        catId || (categories.length > 0 ? categories[0].id : null);

      db.all(
        "SELECT * FROM codex_groups WHERE category_id = ?",
        [activeCatId],
        (err, groups) => {
          if (err) return res.render("error", { message: "DB Error" });

          const activeGroupId =
            groupId || (groups.length > 0 ? groups[0].id : null);

          db.all(
            "SELECT * FROM codex_pets WHERE group_id = ?",
            [activeGroupId],
            (err, pets) => {
              if (err) return res.render("error", { message: "DB Error" });

              res.render("pages/codex_pet", {
                title: "Pet Codex",
                categories,
                groups,
                pets,
                activeCatId,
                activeGroupId,
              });
            }
          );
        }
      );
    }
  );
};
