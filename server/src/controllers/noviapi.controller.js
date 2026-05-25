const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const vm = require('vm');

module.exports = {
  /**
   * Fetch all custom scripts for the user's organization
   */
  async getScripts(req, res) {
    const { organizationId } = req.user;

    try {
      const scripts = await prisma.customScript.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, scripts });
    } catch (e) {
      console.error("Failed to fetch custom scripts:", e);
      return res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Create a new custom script with a unique timestamp name
   */
  async createScript(req, res) {
    const { organizationId } = req.user;
    const timestampName = `new-function-${Date.now()}`;

    try {
      const script = await prisma.customScript.create({
        data: {
          name: timestampName,
          organizationId,
          code: `async (input) => {\n  const val = input.value;\n  console.log("Variável de entrada recebida:", val);\n  return { success: true, data: val };\n}`,
          isActive: true
        }
      });

      return res.status(201).json({ success: true, script });
    } catch (e) {
      console.error("Failed to create custom script:", e);
      return res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Update an existing custom script
   */
  async updateScript(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    try {
      const script = await prisma.customScript.findFirst({
        where: { id, organizationId }
      });

      if (!script) {
        return res.status(404).json({ success: false, error: "Script not found." });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.customScript.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ success: true, script: updated });
    } catch (e) {
      console.error("Failed to update custom script:", e);
      return res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Delete a custom script
   */
  async deleteScript(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;

    try {
      const script = await prisma.customScript.findFirst({
        where: { id, organizationId }
      });

      if (!script) {
        return res.status(404).json({ success: false, error: "Script not found." });
      }

      await prisma.customScript.delete({
        where: { id }
      });

      return res.status(200).json({ success: true, message: "Script deleted successfully." });
    } catch (e) {
      console.error("Failed to delete custom script:", e);
      return res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Execute custom script inside secure Node VM context
   */
  async executeScript(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { input } = req.body; // JSON object to pass as "input" variable

    try {
      const script = await prisma.customScript.findFirst({
        where: { id, organizationId }
      });

      if (!script) {
        return res.status(404).json({ success: false, error: "Script not found." });
      }

      const logs = [];
      const formatArg = (a) => typeof a === 'object' ? JSON.stringify(a) : String(a);
      
      // Isolated sandbox object with dynamic console logging capture
      const sandbox = {
        input: input || {},
        console: {
          log: (...args) => logs.push(args.map(formatArg).join(' ')),
          error: (...args) => logs.push('ERROR: ' + args.map(formatArg).join(' ')),
          warn: (...args) => logs.push('WARN: ' + args.map(formatArg).join(' ')),
          info: (...args) => logs.push('INFO: ' + args.map(formatArg).join(' '))
        }
      };

      // Wrap code in immediately invoked async expression and run securely with a 1500ms timeout
      const scriptSource = `
        (async () => {
          try {
            const userFunc = ${script.code};
            return await userFunc(input);
          } catch (err) {
            throw err;
          }
        })()
      `;

      try {
        const vmPromise = vm.runInNewContext(scriptSource, sandbox, { timeout: 1500 });
        const result = await vmPromise;
        return res.status(200).json({ success: true, result, logs });
      } catch (execErr) {
        return res.status(200).json({ 
          success: false, 
          error: execErr.message || String(execErr), 
          logs: [...logs, `CRITICAL RUNTIME ERROR: ${execErr.message || String(execErr)}`] 
        });
      }
    } catch (e) {
      console.error("VM sandbox execution failed:", e);
      return res.status(500).json({ success: false, error: "Internal server error during VM sandbox initialization." });
    }
  }
};
