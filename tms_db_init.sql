-- phpMyAdmin SQL Dump
-- version 4.8.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 26, 2018 at 09:33 PM
-- Server version: 5.7.24-0ubuntu0.18.04.1
-- PHP Version: 7.2.10-0ubuntu0.18.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ivy`
--

-- --------------------------------------------------------

--
-- Table structure for table `job`
--

CREATE TABLE `job` (
  `job_id` int(11) NOT NULL,
  `job_title` varchar(1000) NOT NULL,
  `detail` longtext NOT NULL,
  `start_time` datetime(6) NOT NULL,
  `duration` int(11) NOT NULL,
  `job_status` enum('unassigned','completed','processing','postponed','assigned') NOT NULL DEFAULT 'unassigned',
  `user_id` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `job`
--

INSERT INTO `job` (`job_id`, `job_title`, `detail`, `start_time`, `duration`, `job_status`, `user_id`, `created_at`, `update_at`) VALUES
(1, '001 new job', 'Assemble Furniture 01 new job', '2018-10-25 13:00:00.000000', 90, 'unassigned', 0, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(2, '002 new job', 'Assemble Furniture 02 new job', '2018-10-25 12:30:00.000000', 100, 'completed', 5, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(3, '003 new job', 'Assemble Furniture 03 new job', '2018-10-25 13:00:00.000000', 120, 'unassigned', 0, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(4, '004 new job', 'Assemble Furniture 04 new job', '2018-10-26 09:30:00.000000', 90, 'postponed', 3, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(5, '005 new job', 'Assemble Furniture 05 new job', '2018-10-26 13:00:00.000000', 150, 'processing', 2, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(6, '006 new job', 'Assemble Furniture 06 new job', '2018-10-26 10:00:00.000000', 60, 'assigned', 1, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(7, '007 new job', 'Assemble Furniture 07 new job', '2018-10-25 09:00:00.000000', 60, 'completed', 5, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(8, '008 new job', 'Assemble Furniture 08 new job', '2018-10-25 15:30:00.000000', 150, 'processing', 3, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(9, '009 new job', 'Assemble Furniture 09 new job', '2018-10-26 15:00:00.000000', 100, 'assigned', 6, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(10, '010 new job', 'Assemble Furniture 10 new job', '2018-10-25 10:00:00.000000', 60, 'completed', 6, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(13, '013 new job', 'Assemble Furniture 013 new job', '2018-10-26 10:30:00.000000', 90, 'completed', 4, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(14, '014 new job', 'Assemble Furniture 014 new job', '2018-10-26 08:30:00.000000', 60, 'postponed', 2, '2018-10-14 20:44:04', '2018-10-14 20:44:49'),
(16, '016 new job', 'Assemble Furniture 016 new job', '2018-10-26 14:00:00.000000', 150, 'postponed', 4, '2018-10-14 20:44:04', '2018-10-14 20:44:49');

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `user_id` int(11) NOT NULL,
  `sid` varchar(128) NOT NULL,
  `browser_id` varchar(128) DEFAULT NULL,
  `expire` int(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `session`
--

INSERT INTO `session` (`user_id`, `sid`, `browser_id`, `expire`) VALUES
(1, 'TMS26a21km0p8ificpq8incso2hjg', NULL, 1542925905),
(1, 'TMS366de272e562630aca75c597ffff550c', 'BROWSERID78d291fdb31847dd7b658d324ae866a7', 1543134762),
(1, 'TMS3hvai4k7ddv11cv13u1u6rguio', NULL, 1542929075),
(1, 'TMS4n8f912p729vdicsvufkuqf6g7', NULL, 1543029313),
(1, 'TMS7c84fi4dm9afprp1baj55rhnmr', NULL, 1543096509),
(1, 'TMSa80ed46ggic2imi7l9o0tndst7', NULL, 1542961901),
(1, 'TMSba3d3750cb748c5b99cc78d8b9198915', NULL, 1542955111),
(1, 'TMScar72mna1h6btmfrsbnbf69h4o', NULL, 1542954082),
(1, 'TMSqcrq68emm82b6fs57d8nlv42u2', NULL, 1542932215),
(1, 'TMSupkbsd85mhjegqqcqh2nh8rmgc', NULL, 1543010360);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(500) NOT NULL,
  `password` varchar(256) NOT NULL,
  `phone` varchar(100) NOT NULL,
  `image` varchar(1000) DEFAULT NULL,
  `role` enum('manager','staff') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `first_name`, `last_name`, `email`, `password`, `phone`, `image`, `role`) VALUES
(1, 'Admin', 'Smith', 'admin@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'manager'),
(2, 'Leo', 'Chen', 'leo@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'staff'),
(3, 'Kacy', 'Feng', 'kacy@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'staff'),
(4, 'Lucy', 'Mile', 'lucy@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'staff'),
(5, 'Jhon', 'Pro', 'jhon@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'staff'),
(6, 'Kevin', 'Con', 'kevin@example.com', '$2y$10$MkVC7A5BvmMyyEdwnk6eve9TWZt07QDm/ukqhFiUJWKa.9LvDfVmG', '021 23426554', NULL, 'staff');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `job`
--
ALTER TABLE `job`
  ADD PRIMARY KEY (`job_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`sid`),
  ADD KEY `browser_id` (`browser_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `job`
--
ALTER TABLE `job`
  MODIFY `job_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
