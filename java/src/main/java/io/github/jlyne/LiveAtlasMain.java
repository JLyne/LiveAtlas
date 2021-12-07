package io.github.jlyne;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Paths;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.server.PluginEnableEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.PluginManager;
import org.bukkit.plugin.java.JavaPlugin;
import org.dynmap.DynmapAPI;

public class LiveAtlasMain extends JavaPlugin {
	private static Logger log;
	Plugin dynmap;
	DynmapAPI api;
	FileConfiguration cfg;

	int updates_per_tick = 20;
	int vupdates_per_tick = 20;

	HashMap<String, Integer> lookup_cache = new HashMap<String, Integer>();
	HashMap<String, Integer> vlookup_cache = new HashMap<String, Integer>();

	@Override
	public void onLoad() {
		log = this.getLogger();
	}

	public static void info(String msg) {
		log.log(Level.INFO, msg);
	}
	public static void severe(String msg) {
		log.log(Level.SEVERE, msg);
	}

	private class LiveAtlasServierListener implements Listener {
		@EventHandler(priority=EventPriority.MONITOR)
		public void onPluginEnable(PluginEnableEvent event) {
			Plugin p = event.getPlugin();
			String name = p.getDescription().getName();
			if (name.equals("dynmap")) {
				activate();
			}
		}
	}

	public void onEnable() {
		info("initializing");
		PluginManager pm = getServer().getPluginManager();
		/* Get dynmap */
		dynmap = pm.getPlugin("dynmap");
		if (dynmap == null) {
			severe("Cannot find dynmap!");
			return;
		}

		getServer().getPluginManager().registerEvents(new LiveAtlasServierListener(), this);

		/* If enabled, activate */
		if (dynmap.isEnabled())
			activate();
	}

	private void activate() {
		String version = this.getDescription().getVersion();

		try {
			File liveAtlasFolderPath = this.getDataFolder();
			deleteDir(liveAtlasFolderPath);
			copyJarFile(this.getFile().getAbsoluteFile().toString());
			File dynmapWebFolderPath = Paths.get(dynmap.getDataFolder().toURI()).resolve("web").toFile();
			copyDirectory(liveAtlasFolderPath, dynmapWebFolderPath);
			deleteDir(liveAtlasFolderPath);
		} catch (IOException e) {
			throw new RuntimeException("LiveAtlas v" + version + " installation failed", e);
		}

		info("LiveAtlas v" + version + " installation succeeded");
	}

	public void onDisable() {
	}

	public void deleteDir(File file) {
		File[] list = file.listFiles();
		if (list != null) {
			for (File child : list) {
				deleteDir(child);
			}
		}
		file.delete();
	}

	public void copyJarFile(String jarfile) throws IOException {        /* Open JAR as ZIP */
        ZipFile zf = null;
        FileOutputStream fos = null;
        InputStream ins = null;
        byte[] buf = new byte[2048];
        String n = null;

		File f;
		zf = new ZipFile(jarfile);
		Enumeration<? extends ZipEntry> e = zf.entries();
		while (e.hasMoreElements()) {
			ZipEntry ze = e.nextElement();
			n = ze.getName();
			f = new File(this.getDataFolder(), n);
			if (n.startsWith("io/")) continue;
			if (n.startsWith("META-INF/")) continue;
			if (n == "plugin.yml") continue;
			if (ze.isDirectory()) {
				f.mkdirs();
			}
			else {
				f.getParentFile().mkdirs();
				fos = new FileOutputStream(f);
				ins = zf.getInputStream(ze);
				int len;
				while ((len = ins.read(buf)) >= 0) {
					fos.write(buf, 0, len);
				}
				ins.close();
				ins = null;
				fos.close();
				fos = null;
			}
		}
		zf.close();
	}

	private static void copyDirectory(File sourceDirectory, File destinationDirectory) throws IOException {
		if (!destinationDirectory.exists()) {
			destinationDirectory.mkdir();
		}
		for (String f : sourceDirectory.list()) {
			copyDirectoryCompatibityMode(new File(sourceDirectory, f), new File(destinationDirectory, f));
		}
	}

	public static void copyDirectoryCompatibityMode(File sourceDirectory, File destinationDirectory) throws IOException {
		info(sourceDirectory.getName());
		if (sourceDirectory.isDirectory()) {
			copyDirectory(sourceDirectory, destinationDirectory);
		} else {
			copyFile(sourceDirectory, destinationDirectory);
		}
	}

	private static void copyFile(File sourceFile, File destinationFile) throws IOException {
		try (InputStream in = new FileInputStream(sourceFile);
			OutputStream out = new FileOutputStream(destinationFile)) {
			byte[] buf = new byte[1024];
			int length;
			while ((length = in.read(buf)) > 0) {
				out.write(buf, 0, length);
			}
		}
	}
}
